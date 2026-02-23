import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Authentication helper - validates JWT and returns user
const authenticateRequest = async (req: Request): Promise<{ user: any; error: string | null }> => {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header" };
  }
  
  const token = authHeader.replace("Bearer ", "");
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, error: error?.message || "Invalid or expired token" };
  }
  
  return { user, error: null };
};

const sendEmail = async (payload: {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string; type?: string }>;
}) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send email");
  }
  
  return response.json();
};

// Generate PDF from HTML using a simple PDF generation approach
const generatePdfFromHtml = async (htmlContent: string): Promise<Uint8Array> => {
  // Use jsPDF-like approach with a PDF generation service or build PDF manually
  // For simplicity, we'll create a basic PDF structure
  const encoder = new TextEncoder();
  
  // Extract text content from HTML for PDF
  const textContent = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Create a simple PDF
  const pdfContent = createSimplePdf(textContent);
  return pdfContent;
};

// Create a minimal valid PDF
const createSimplePdf = (text: string): Uint8Array => {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Build PDF content
  let pdf = '%PDF-1.4\n';
  
  // Catalog
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  
  // Pages
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  
  // Page
  pdf += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
  
  // Font
  pdf += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n';
  
  // Build content stream with text
  let content = 'BT\n/F1 10 Tf\n';
  let yPos = 800;
  const lineHeight = 14;
  const leftMargin = 50;
  const maxWidth = 500;
  
  for (const line of lines) {
    if (yPos < 50) break; // Stop if we run out of page
    
    // Escape special PDF characters and encode properly
    const escapedLine = line
      .substring(0, 80) // Limit line length
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E€]/g, ''); // Remove non-printable chars except euro
    
    if (escapedLine.trim()) {
      content += `1 0 0 1 ${leftMargin} ${yPos} Tm\n(${escapedLine}) Tj\n`;
      yPos -= lineHeight;
    }
  }
  
  content += 'ET';
  
  // Content stream
  const contentLength = content.length;
  pdf += `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${content}\nendstream\nendobj\n`;
  
  // Cross-reference table
  const xrefOffset = pdf.length;
  pdf += 'xref\n0 6\n0000000000 65535 f \n';
  
  let offset = 9; // After %PDF-1.4\n
  pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  offset += 52;
  pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  offset += 52;
  pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  offset += 120;
  
  // Calculate font object offset
  const fontOffset = pdf.indexOf('5 0 obj');
  pdf += `${fontOffset.toString().padStart(10, '0')} 00000 n \n`;
  
  // Calculate content object offset  
  const contentOffset = pdf.indexOf('4 0 obj');
  pdf += `${contentOffset.toString().padStart(10, '0')} 00000 n \n`;
  
  // Trailer
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  
  return new TextEncoder().encode(pdf);
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProposalEmailRequest {
  to: string;
  cc?: string;
  subject: string;
  message?: string;
  clientName: string;
  clientEmail?: string;
  investmentAmount: number;
  duration: number;
  monthlyRent: number;
  rentWithServices: number;
  contractCost: number;
  linesCount: number;
  optionsCount: number;
  templateName?: string;
  pdfBase64?: string;
  pdfFileName?: string;
}

const formatNumber = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ==========================================
    // AUTHENTICATION - Validate user JWT token
    // ==========================================
    const { user, error: authError } = await authenticateRequest(req);
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: authError || "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log("Authenticated user:", user.email);

    const data: ProposalEmailRequest = await req.json();
    
    const {
      to,
      cc,
      subject,
      message,
      clientName,
      clientEmail,
      investmentAmount,
      duration,
      monthlyRent,
      rentWithServices,
      contractCost,
      linesCount,
      optionsCount,
      templateName,
      pdfBase64,
      pdfFileName
    } = data;

    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const MAX_SUBJECT_LENGTH = 200;
    const MAX_MESSAGE_LENGTH = 10000;

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Email destinataire et sujet requis" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format for all recipients
    const allToEmails = to.split(',').map(e => e.trim()).filter(Boolean);
    const invalidToEmails = allToEmails.filter(e => !EMAIL_REGEX.test(e));
    if (invalidToEmails.length > 0) {
      return new Response(
        JSON.stringify({ error: `Format email invalide : ${invalidToEmails.join(', ')}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (cc) {
      const allCcEmails = cc.split(',').map(e => e.trim()).filter(Boolean);
      const invalidCcEmails = allCcEmails.filter(e => !EMAIL_REGEX.test(e));
      if (invalidCcEmails.length > 0) {
        return new Response(
          JSON.stringify({ error: `Format email CC invalide : ${invalidCcEmails.join(', ')}` }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    if (subject.length > MAX_SUBJECT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Le sujet ne doit pas dépasser ${MAX_SUBJECT_LENGTH} caractères` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (message && message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Le message ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate numeric values are positive
    if (typeof investmentAmount === 'number' && investmentAmount < 0) {
      return new Response(
        JSON.stringify({ error: "Le montant d'investissement doit être positif" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (typeof duration === 'number' && duration <= 0) {
      return new Response(
        JSON.stringify({ error: "La durée doit être positive" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (typeof monthlyRent === 'number' && monthlyRent < 0) {
      return new Response(
        JSON.stringify({ error: "Le loyer mensuel doit être positif" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const date = new Date().toLocaleDateString('fr-FR');
    
    // Use the correct rent value for display - if rentWithServices is 0, use monthlyRent
    const displayRent = rentWithServices > 0 ? rentWithServices : monthlyRent;
    const hasServicesIncluded = rentWithServices > 0 && rentWithServices !== monthlyRent;

    // Generate email HTML content
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 30px 0; border-bottom: 2px solid #e5e7eb; }
          .header h1 { color: #2563eb; margin: 0 0 10px 0; }
          .content { padding: 30px 0; }
          .summary-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .summary-row:last-child { border-bottom: none; }
          .summary-label { color: #6b7280; }
          .summary-value { font-weight: 600; }
          .highlight-box { background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe; text-align: center; }
          .highlight-value { font-size: 24px; font-weight: 700; color: #2563eb; }
          .message-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
          .attachment-notice { background: #fef3c7; padding: 12px 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #fcd34d; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Proposition de Location</h1>
            <p style="color: #6b7280; margin: 0;">Financière Professionnelle</p>
          </div>
          
          <div class="content">
            <p>Bonjour,</p>
            
            ${message ? `
              <div class="message-box">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
            ` : `
              <p>Veuillez trouver ci-dessous le récapitulatif de votre proposition de location.</p>
            `}
            
            ${pdfBase64 ? `
              <div class="attachment-notice">
                <strong>📎 Document PDF joint</strong>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #92400e;">La proposition complète est disponible en pièce jointe.</p>
              </div>
            ` : ''}
            
            <div class="summary-box">
              <h3 style="margin-top: 0; color: #374151;">Client</h3>
              <p style="font-weight: 600; margin: 0;">${clientName}</p>
              ${clientEmail ? `<p style="color: #6b7280; margin: 4px 0;">${clientEmail}</p>` : ''}
            </div>
            
            <div class="summary-box">
              <h3 style="margin-top: 0; color: #374151;">Détails de l'offre</h3>
              <div class="summary-row">
                <span class="summary-label">Investissement HT</span>
                <span class="summary-value">${formatNumber(investmentAmount)} €</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Durée du contrat</span>
                <span class="summary-value">${duration} mois</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Nombre de lignes</span>
                <span class="summary-value">${linesCount}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Options sélectionnées</span>
                <span class="summary-value">${optionsCount}</span>
              </div>
            </div>
            
            <div class="highlight-box">
              <p style="color: #6b7280; margin: 0 0 8px 0;">Loyer mensuel HT${hasServicesIncluded ? ' (services inclus)' : ''}</p>
              <p class="highlight-value">${formatNumber(displayRent)} €</p>
            </div>
            
            ${hasServicesIncluded ? `
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Loyer mensuel HT (hors services)</span>
                  <span class="summary-value">${formatNumber(monthlyRent)} €</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Coût total du contrat</span>
                  <span class="summary-value" style="color: #16a34a;">${formatNumber(contractCost)} €</span>
                </div>
              </div>
            ` : `
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Coût total du contrat</span>
                  <span class="summary-value" style="color: #16a34a;">${formatNumber(contractCost)} €</span>
                </div>
              </div>
            `}
            
            <p style="color: #6b7280; font-size: 14px;">
              Cette proposition est valable 30 jours à compter de la date d'envoi.
              Pour toute question, n'hésitez pas à nous contacter.
            </p>
          </div>
          
          <div class="footer">
            <p>Document envoyé le ${date}</p>
            ${templateName ? `<p>Template : ${templateName}</p>` : ''}
            <p>CybertekPro - Financière Professionnelle</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare recipients
    const toRecipients = to.split(',').map(email => email.trim()).filter(Boolean);
    const ccRecipients = cc ? cc.split(',').map(email => email.trim()).filter(Boolean) : undefined;

    // Prepare email payload
    const emailPayload: {
      from: string;
      to: string[];
      cc?: string[];
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: string; type?: string }>;
    } = {
      from: "Proposition <onboarding@resend.dev>",
      to: toRecipients,
      cc: ccRecipients,
      subject: subject,
      html: emailHTML,
    };
    
    // Add PDF attachment if HTML content provided
    if (pdfBase64 && pdfFileName) {
      try {
        // Decode the HTML from base64
        const htmlContent = decodeURIComponent(escape(atob(pdfBase64)));
        
        // Generate PDF from HTML
        const pdfBytes = await generatePdfFromHtml(htmlContent);
        
        // Convert to base64
        const pdfBase64Content = btoa(String.fromCharCode(...pdfBytes));
        
        emailPayload.attachments = [
          {
            filename: pdfFileName,
            content: pdfBase64Content,
            type: 'application/pdf',
          }
        ];
        
        console.log("PDF attachment created successfully");
      } catch (pdfError) {
        console.error("Error generating PDF, falling back to HTML:", pdfError);
        // Fallback to HTML attachment if PDF generation fails
        emailPayload.attachments = [
          {
            filename: pdfFileName.replace('.pdf', '.html'),
            content: pdfBase64,
            type: 'text/html',
          }
        ];
      }
    }

    const emailResponse = await sendEmail(emailPayload);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true, 
      message: "Email envoyé avec succès",
      id: emailResponse.id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-proposal-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur lors de l'envoi de l'email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
