import { supabase } from '../supabaseClient';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as use from '@tensorflow-models/universal-sentence-encoder';

// Cache the model instance
let encoder = null;

// Initialize the model
const initializeModel = async () => {
  if (!encoder) {
    try {
      console.log('Setting up TensorFlow backend...');
      await tf.ready();
      await tf.setBackend('webgl');
      console.log('TensorFlow backend initialized:', tf.getBackend());

      console.log('Loading Universal Sentence Encoder...');
      encoder = await use.load();
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error initializing model:', error);
      throw error;
    }
  }
  return encoder;
};

// Function to create embeddings
const createEmbedding = async (text) => {
  try {
    const model = await initializeModel();
    console.log('Starting embedding generation for text length:', text.length);
    
    // Generate embedding
    const embeddings = await model.embed([text]);
    const embeddingArray = await embeddings.array();
    console.log('Generated embedding successfully');
    
    // Cleanup
    embeddings.dispose();
    
    return embeddingArray[0];
  } catch (error) {
    console.error('Error in createEmbedding:', error);
    throw error;
  }
};

// Improved chunk creation for academic papers
const chunkText = (text, maxLength = 1500) => {
  // Split into sections based on common academic paper headers
  const sectionHeaders = /\b(ABSTRACT|INTRODUCTION|METHODOLOGY|METHODS|RESULTS|DISCUSSION|CONCLUSION)\b/i;
  const sections = text.split(sectionHeaders);
  
  const chunks = [];
  let currentChunk = '';
  
  sections.forEach(section => {
    // Split section into sentences
    const sentences = section.match(/[^.!?]+[.!?]+/g) || [];
    
    sentences.forEach(sentence => {
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    });
  });
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
};

// Function to extract text from PDF
const extractTextFromPdf = async (pdfUrl) => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  let text = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + ' ';
  }
  
  return text;
};

// Function to store chunks and embeddings
export const processAndStorePdf = async (paperId, pdfUrl) => {
  try {
    console.log('Starting PDF processing for paper:', paperId);
    const text = await extractTextFromPdf(pdfUrl);
    console.log('Text extracted, length:', text.length);
    
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks`);
    
    // Process chunks in smaller batches
    const BATCH_SIZE = 5;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(chunks.length/BATCH_SIZE)}`);
      
      const batchWithEmbeddings = await Promise.all(
        batch.map(async (chunk) => {
          const embedding = await createEmbedding(chunk);
          return {
            paper_id: paperId,
            content: chunk,
            embedding
          };
        })
      );
      
      // Insert batch into database
      const { error } = await supabase
        .from('paper_chunks')
        .insert(batchWithEmbeddings);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      console.log(`Successfully inserted batch ${Math.floor(i/BATCH_SIZE) + 1}`);
    }
    
    // Verify final count
    const { count, error: countError } = await supabase
      .from('paper_chunks')
      .select('*', { count: 'exact' })
      .eq('paper_id', paperId);
      
    if (countError) throw countError;
    
    console.log(`Successfully processed paper. Total chunks stored: ${count}`);
    
  } catch (error) {
    console.error('Detailed error in processAndStorePdf:', error);
    throw error;
  }
};

// Function to search across papers
export const searchPapers = async (query, paperIds) => {
  try {
    console.log('Searching for:', query, 'in papers:', paperIds);
    
    // Get chunks with their embeddings
    const { data: chunks, error } = await supabase
      .from('paper_chunks')
      .select('*')
      .in('paper_id', paperIds);

    if (error) {
      console.error('Error fetching chunks:', error);
      return [];
    }

    console.log('Found chunks:', chunks.length);

    const queryEmbedding = await createEmbedding(query);
    
    // Calculate similarities without threshold
    const similarities = chunks.map(chunk => ({
      content: chunk.content,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Get top 3 most similar chunks regardless of similarity score
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    console.log('Top similarities:', topResults.map(r => r.similarity));
    
    return topResults.map(r => r.content);

  } catch (error) {
    console.error('Error in searchPapers:', error);
    return [];
  }
};

// Helper function for cosine similarity
const cosineSimilarity = (a, b) => {
  try {
    // Ensure inputs are arrays
    const arrayA = Array.isArray(a) ? a : Array.from(a);
    const arrayB = Array.isArray(b) ? b : Array.from(b);

    if (!arrayA.length || !arrayB.length) {
      console.error('Empty embedding array detected');
      return 0;
    }

    const dotProduct = arrayA.reduce((sum, val, i) => sum + val * arrayB[i], 0);
    const magnitudeA = Math.sqrt(arrayA.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(arrayB.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      console.error('Zero magnitude detected');
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  } catch (error) {
    console.error('Error calculating similarity:', error, 'Inputs:', { a, b });
    return 0;
  }
}; 