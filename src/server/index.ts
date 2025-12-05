import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { generateInvoice } from '../lib-public/generate-invoice';
import { generatePDFUPO } from '../lib-public/UPO-4_2-generators';
import { AdditionalDataTypes } from '../lib-public/types/common.types';

const app = express();

const uploadDir = path.resolve(__dirname, '../../tmp/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/api/generate-invoice', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  const xmlFile = req.file;
  try {
    const { metadata } = req.body;
    if (!metadata || !xmlFile) {
      return res.status(400).json({ error: 'Missing metadata or file' });
    }

    const additionalData: AdditionalDataTypes = JSON.parse(metadata);
    const xmlContent = fs.readFileSync(xmlFile.path, 'utf-8');

    const pdfBuffer = await generateInvoice(xmlContent, additionalData, 'buffer');

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  } finally {
    if (xmlFile) fs.unlinkSync(xmlFile.path);
  }
});

app.post('/api/generate-upo', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  const xmlFile = req.file;
  try {
    if (!xmlFile) {
      return res.status(400).json({ error: 'Missing file' });
    }

    const xmlContent = fs.readFileSync(xmlFile.path, 'utf-8');
    const pdfBuffer = await generatePDFUPO(xmlContent, 'buffer');

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  } finally {
    if (xmlFile) fs.unlinkSync(xmlFile.path);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
