import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { generateInvoice } from '../lib-public/generate-invoice';
import { generatePDFUPO } from '../lib-public/UPO-4_2-generators';
import { AdditionalDataTypes } from '../lib-public/types/common.types';

const app = express();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

app.post('/api/generate-invoice', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  const xmlFile = req.file;
  try {
    const { metadata } = req.body;
    if (!metadata || !xmlFile) {
      return res.status(400).json({ error: 'Missing metadata or file' });
    }

    const additionalData: AdditionalDataTypes = JSON.parse(metadata);
    const xmlContent = xmlFile.buffer.toString('utf-8');

    const pdfBuffer = await generateInvoice(xmlContent, additionalData, 'buffer');

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

app.post('/api/generate-upo', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  const xmlFile = req.file;
  try {
    if (!xmlFile) {
      return res.status(400).json({ error: 'Missing file' });
    }

    const xmlContent = xmlFile.buffer.toString('utf-8');
    const pdfBuffer = await generatePDFUPO(xmlContent, 'buffer');

    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size limit exceeded. Maximum size is 10MB.' });
  }
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
