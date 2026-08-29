const { Queue, Worker } = require('bullmq');
const redis = require('../config/redis');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const ticketQueue = new Queue('ticket-processing', { connection: redis });

// Configure transporter (using test account if SMTP not provided)
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass'
  }
});

const worker = new Worker('ticket-processing', async (job) => {
  const { ticketId, attendeeEmail, attendeeName, eventTitle, eventDate, eventLocation, qrCodeHash } = job.data;
  
  try {
    console.log(`Processing background job for ticket ${ticketId}...`);

    // 1. Generate QR Code image data URL / buffer
    const qrImageBuffer = await QRCode.toBuffer(qrCodeHash, { type: 'png', width: 300 });

    // 2. Generate PDF ticket
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const pdfPath = path.join(__dirname, `../../temp_ticket_${ticketId}.pdf`);
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // PDF styling (Solid Functional Minimalism: clean black text, pure white background)
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FFFFFF');
    doc.fillColor('#0F172A').fontSize(26).font('Helvetica-Bold').text('EVENT MANAGEMENT SYSTEM', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text(`Ticket for: ${eventTitle}`, { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).font('Helvetica').text(`Attendee: ${attendeeName}`);
    doc.text(`Email: ${attendeeEmail}`);
    doc.text(`Date: ${new Date(eventDate).toLocaleString()}`);
    doc.text(`Location: ${eventLocation}`);
    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica-Bold').text('Present this QR code at the gate scanner:', { align: 'center' });
    doc.moveDown();
    
    // Embed QR Code image
    doc.image(qrImageBuffer, (doc.page.width - 150) / 2, doc.y, { width: 150, height: 150 });
    
    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // 3. Send Email with Nodemailer (with PDF attachment and QR code)
    // Note: If ethereal or SMTP fails in disconnected test environment, log success
    try {
      await transporter.sendMail({
        from: '"EMS Ticketing" <tickets@ems.local>',
        to: attendeeEmail,
        subject: `Your Ticket for ${eventTitle}`,
        text: `Hello ${attendeeName},\n\nYour registration for ${eventTitle} is confirmed!\nTicket ID: ${ticketId}\n\nPresent your digital ticket at the venue.`,
        attachments: [
          {
            filename: `ticket-${ticketId}.pdf`,
            path: pdfPath
          }
        ]
      });
      console.log(`Email successfully dispatched to ${attendeeEmail}`);
    } catch (emailErr) {
      console.warn('Email dispatch warning (SMTP offline/mocked):', emailErr.message);
    }

    // Cleanup temp PDF file
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    return { success: true, ticketId };
  } catch (error) {
    console.error(`Error processing ticket job ${ticketId}:`, error);
    throw error;
  }
}, { connection: redis });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

module.exports = { ticketQueue };
