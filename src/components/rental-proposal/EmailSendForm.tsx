import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, CheckCircle, Paperclip } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

interface EmailSendFormProps {
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
  pdfHtmlContent?: string;
}

export function EmailSendForm({
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
  pdfHtmlContent
}: EmailSendFormProps) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [attachPdf, setAttachPdf] = useState(true);
  const [formData, setFormData] = useState({
    to: clientEmail || '',
    cc: '',
    subject: `Proposition de Location - ${clientName || 'Client'}`,
    message: `Bonjour,\n\nVeuillez trouver ci-joint notre proposition de location pour votre projet.\n\nN'hésitez pas à nous contacter pour toute question.\n\nCordialement,`
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset sent state on any change
    if (isSent) setIsSent(false);
  };

  const validateEmail = (email: string) => {
    const emails = email.split(',').map(e => e.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.every(e => e === '' || emailRegex.test(e));
  };

  const generatePdfFileName = () => {
    const safeName = clientName.replace(/[^a-zA-Z0-9]/g, '_') || 'Proposition';
    const date = new Date().toISOString().split('T')[0];
    return `Proposition_${safeName}_${date}.html`;
  };

  const handleSendEmail = async () => {
    // Validation
    if (!formData.to.trim()) {
      toast({
        title: "Email requis",
        description: "Veuillez saisir une adresse email destinataire.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(formData.to)) {
      toast({
        title: "Email invalide",
        description: "Veuillez vérifier le format de l'adresse email.",
        variant: "destructive"
      });
      return;
    }

    if (formData.cc && !validateEmail(formData.cc)) {
      toast({
        title: "Email CC invalide",
        description: "Veuillez vérifier le format des adresses en copie.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      // Prepare PDF attachment if enabled and content available
      let pdfBase64: string | undefined;
      let pdfFileName: string | undefined;
      
      if (attachPdf && pdfHtmlContent) {
        // Convert HTML to base64 for attachment
        pdfBase64 = btoa(unescape(encodeURIComponent(pdfHtmlContent)));
        pdfFileName = generatePdfFileName();
      }

      const { data, error } = await supabase.functions.invoke('send-proposal-email', {
        body: {
          to: formData.to,
          cc: formData.cc || undefined,
          subject: formData.subject,
          message: formData.message,
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
        }
      });

      if (error) throw error;

      setIsSent(true);
      toast({
        title: "Email envoyé !",
        description: `La proposition a été envoyée à ${formData.to}${attachPdf ? ' avec la pièce jointe' : ''}`,
      });

    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer l'email. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-to">Email destinataire *</Label>
        <Input
          id="email-to"
          type="email"
          placeholder="client@example.com"
          value={formData.to}
          onChange={(e) => handleChange('to', e.target.value)}
          disabled={isSending}
        />
        <p className="text-xs text-muted-foreground">
          Séparez les adresses par des virgules pour plusieurs destinataires
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-cc">CC (copie)</Label>
        <Input
          id="email-cc"
          type="email"
          placeholder="copie@example.com"
          value={formData.cc}
          onChange={(e) => handleChange('cc', e.target.value)}
          disabled={isSending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-subject">Sujet</Label>
        <Input
          id="email-subject"
          type="text"
          value={formData.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          disabled={isSending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-message">Message personnalisé</Label>
        <Textarea
          id="email-message"
          placeholder="Ajoutez un message personnalisé..."
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          disabled={isSending}
          rows={4}
        />
      </div>

      {pdfHtmlContent && (
        <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="attach-pdf"
            checked={attachPdf}
            onCheckedChange={(checked) => setAttachPdf(checked === true)}
            disabled={isSending}
          />
          <Label 
            htmlFor="attach-pdf" 
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Joindre la proposition en pièce jointe (HTML)
          </Label>
        </div>
      )}

      <Button
        onClick={handleSendEmail}
        disabled={isSending || !formData.to.trim()}
        className="w-full"
        variant={isSent ? "outline" : "default"}
      >
        {isSending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Envoi en cours...
          </>
        ) : isSent ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Email envoyé !
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Envoyer par email
          </>
        )}
      </Button>

      {isSent && (
        <p className="text-sm text-center text-muted-foreground">
          Envoyé à : {formData.to}
        </p>
      )}
    </div>
  );
}
