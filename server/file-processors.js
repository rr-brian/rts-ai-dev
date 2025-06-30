/**
 * File processing module for extracting text from different document types
 */
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

// Import document processing libraries
const pdfParse = require('pdf-parse');
const docx = require('docx');
const XLSX = require('xlsx');
const csv = require('csv-parser');

/**
 * Process uploaded file and extract text content based on file type
 * @param {Object} fileInfo - File information object
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processFile(fileInfo) {
  try {
    const fileExt = path.extname(fileInfo.originalName).toLowerCase();
    let extractedText = '';
    let metadata = {};
    
    switch (fileExt) {
      case '.pdf':
        const result = await processPdfFile(fileInfo.path);
        extractedText = result.text;
        metadata = result.metadata;
        break;
        
      case '.docx':
      case '.doc':
        const docResult = await processWordFile(fileInfo.path);
        extractedText = docResult.text;
        metadata = docResult.metadata;
        break;
        
      case '.xlsx':
      case '.xls':
        const excelResult = await processExcelFile(fileInfo.path);
        extractedText = excelResult.text;
        metadata = excelResult.metadata;
        break;
        
      case '.csv':
        const csvResult = await processCsvFile(fileInfo.path);
        extractedText = csvResult.text;
        metadata = csvResult.metadata;
        break;
        
      case '.txt':
        const txtResult = await processTextFile(fileInfo.path);
        extractedText = txtResult.text;
        metadata = txtResult.metadata;
        break;
        
      default:
        throw new Error(`Unsupported file extension: ${fileExt}`);
    }
    
    return {
      text: extractedText,
      metadata: {
        ...metadata,
        filename: fileInfo.filename,
        originalName: fileInfo.originalName,
        fileType: fileExt.substring(1),
        fileSize: fileInfo.size
      }
    };
  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process file: ${error.message}`);
  }
}

/**
 * Process PDF file and extract text
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processPdfFile(filePath) {
  try {
    const dataBuffer = await readFileAsync(filePath);
    const data = await pdfParse(dataBuffer);
    
    return {
      text: data.text,
      metadata: {
        pageCount: data.numpages,
        info: data.info
      }
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

/**
 * Process Word file and extract text
 * @param {string} filePath - Path to the Word file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processWordFile(filePath) {
  try {
    const content = await docx.extractRawText({ path: filePath });
    
    return {
      text: content,
      metadata: {
        format: path.extname(filePath).substring(1)
      }
    };
  } catch (error) {
    console.error('Error processing Word document:', error);
    throw new Error(`Failed to process Word document: ${error.message}`);
  }
}

/**
 * Process Excel file and extract text
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    
    let result = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      result += `Sheet: ${sheetName}\n`;
      sheetData.forEach(row => {
        if (row && row.length > 0) {
          result += row.join('\t') + '\n';
        }
      });
      result += '\n';
    });
    
    return {
      text: result,
      metadata: {
        sheets: workbook.SheetNames,
        format: path.extname(filePath).substring(1)
      }
    };
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error(`Failed to process Excel file: ${error.message}`);
  }
}

/**
 * Process CSV file and extract text
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processCsvFile(filePath) {
  try {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          const headers = Object.keys(results[0] || {});
          const rowCount = results.length;
          
          // Convert to string representation
          let textContent = headers.join(', ') + '\n';
          results.forEach(row => {
            textContent += Object.values(row).join(', ') + '\n';
          });
          
          resolve({
            text: textContent,
            metadata: {
              headers,
              rowCount,
              format: 'csv'
            }
          });
        })
        .on('error', reject);
    });
  } catch (error) {
    console.error('Error processing CSV file:', error);
    throw new Error(`Failed to process CSV file: ${error.message}`);
  }
}

/**
 * Process plain text file
 * @param {string} filePath - Path to the text file
 * @returns {Promise<Object>} - Extracted text and metadata
 */
async function processTextFile(filePath) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    
    return {
      text: content,
      metadata: {
        lineCount: content.split('\n').length,
        format: 'txt'
      }
    };
  } catch (error) {
    console.error('Error processing text file:', error);
    throw new Error(`Failed to process text file: ${error.message}`);
  }
}

module.exports = { processFile };
