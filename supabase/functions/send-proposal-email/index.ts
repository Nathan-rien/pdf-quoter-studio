import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const sendEmail = async (payload: {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Validation
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Email destinataire et sujet requis" }),
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
      attachments?: Array<{ filename: string; content: string }>;
    } = {
      from: "Proposition <onboarding@resend.dev>",
      to: toRecipients,
      cc: ccRecipients,
      subject: subject,
      html: emailHTML,
    };
    
    // Add PDF attachment if provided
    if (pdfBase64 && pdfFileName) {
      emailPayload.attachments = [
        {
          filename: pdfFileName,
          content: pdfBase64,
        }
      ];
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
