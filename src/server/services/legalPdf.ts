import PDFDocument from 'pdfkit';
import type { Response } from 'express';
import type { LegalSection } from '../db/legalSeedData.ts';

interface LegalPdfInput {
  slug: string;
  title: string;
  subtitle: string;
  version: string;
  status: string;
  legalReviewNotice: string;
  publishedAt: string | null;
  lastUpdatedAt: string;
  sections: LegalSection[];
}

export function streamLegalDocumentPdf(docData: LegalPdfInput, res: Response): void {
  const safeName = docData.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `HelzerX-${safeName}-v${docData.version}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const pdf = new PDFDocument({
    size: 'A4',
    margins: { top: 56, bottom: 56, left: 54, right: 54 },
    info: {
      Title: `HelzerX Technologies — ${docData.title}`,
      Author: 'HelzerX Technologies Corporate Partnerships Portal',
      Subject: `${docData.title} (Version ${docData.version})`,
    },
  });

  pdf.pipe(res);

  // Header Banner
  pdf.rect(0, 0, pdf.page.width, 76).fill('#0D0F0E');
  pdf
    .fillColor('#9EE855')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('HELZERX TECHNOLOGIES · CORPORATE PARTNERSHIPS PORTAL', 54, 24);
  pdf
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text(docData.title, 54, 42);

  pdf.y = 98;

  // Metadata Line
  pdf
    .fillColor('#4A504C')
    .font('Helvetica')
    .fontSize(9)
    .text(
      `Version: ${docData.version}   |   Status: ${
        docData.status === 'PUBLISHED' ? 'Published' : 'Draft (Pending Legal Counsel Review)'
      }   |   Published: ${docData.publishedAt ? docData.publishedAt.slice(0, 10) : 'Pending Publication'}   |   Last Updated: ${docData.lastUpdatedAt.slice(0, 10)}`,
      { align: 'left' }
    );

  pdf.moveDown(0.75);

  // Subtitle
  pdf
    .fillColor('#111312')
    .font('Helvetica')
    .fontSize(10.5)
    .text(docData.subtitle, { lineGap: 3 });

  pdf.moveDown(0.75);

  // Draft / Legal Review Notice Box
  const noticeTop = pdf.y;
  const noticeTextHeight = pdf.heightOfString(docData.legalReviewNotice, {
    width: pdf.page.width - 132,
  });
  pdf
    .rect(54, noticeTop, pdf.page.width - 108, noticeTextHeight + 22)
    .fillAndStroke('#FFFBEB', '#F59E0B');
  pdf
    .fillColor('#92400E')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('LEGAL REVIEW & DRAFT NOTICE', 66, noticeTop + 8);
  pdf
    .font('Helvetica')
    .fontSize(8.5)
    .text(docData.legalReviewNotice, 66, noticeTop + 20, {
      width: pdf.page.width - 132,
      lineGap: 2,
    });

  pdf.y = noticeTop + noticeTextHeight + 34;

  // Sections
  for (const section of docData.sections) {
    if (pdf.y > pdf.page.height - 140) {
      pdf.addPage();
    }

    pdf
      .fillColor('#2B7A19')
      .font('Helvetica-Bold')
      .fontSize(12.5)
      .text(`${section.number}. ${section.title}`, { lineGap: 2 });
    pdf.moveDown(0.35);

    for (const para of section.paragraphs || []) {
      pdf
        .fillColor('#262A28')
        .font('Helvetica')
        .fontSize(10)
        .text(para, { lineGap: 3 });
      pdf.moveDown(0.4);
    }

    if (section.bullets && section.bullets.length > 0) {
      for (const b of section.bullets) {
        pdf
          .fillColor('#262A28')
          .font('Helvetica')
          .fontSize(9.5)
          .text(`•  ${b}`, { indent: 14, lineGap: 2.5 });
        pdf.moveDown(0.2);
      }
      pdf.moveDown(0.35);
    }

    if (section.subsections && section.subsections.length > 0) {
      for (const sub of section.subsections) {
        if (pdf.y > pdf.page.height - 110) {
          pdf.addPage();
        }
        pdf
          .fillColor('#111312')
          .font('Helvetica-Bold')
          .fontSize(10.5)
          .text(`${sub.number} ${sub.title}`, { indent: 8 });
        pdf.moveDown(0.25);

        for (const sp of sub.paragraphs || []) {
          pdf
            .fillColor('#373C39')
            .font('Helvetica')
            .fontSize(9.5)
            .text(sp, { indent: 8, lineGap: 2.5 });
          pdf.moveDown(0.3);
        }

        if (sub.bullets && sub.bullets.length > 0) {
          for (const sb of sub.bullets) {
            pdf
              .fillColor('#373C39')
              .font('Helvetica')
              .fontSize(9.2)
              .text(`•  ${sb}`, { indent: 22, lineGap: 2 });
            pdf.moveDown(0.18);
          }
          pdf.moveDown(0.3);
        }
      }
    }

    pdf.moveDown(0.4);
  }

  pdf.end();
}
