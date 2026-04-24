import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';
import FormData from 'form-data';

async function generateTestingPDF() {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    // Insert some known skills into the PDF
    const text = "I am a skilled Frontend Developer with experience in HTML, CSS, JavaScript, and React.";
    page.drawText(text, { x: 50, y: 700, size: 20 });
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync('test-cv.pdf', pdfBytes);
}

async function testUpload() {
    await generateTestingPDF();
    const formData = new FormData();
    formData.append('targetRole', 'Frontend Developer');
    formData.append('cv', fs.createReadStream('test-cv.pdf'));

    try {
        const response = await axios.post('http://localhost:5000/api/skill-gap-ai', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });
        console.log("Success! Server Response:");
        console.log(response.data);
    } catch (err) {
        console.error("Error from server:");
        console.error(err.response?.data || err.message);
    }
}

testUpload();
