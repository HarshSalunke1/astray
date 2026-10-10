// RAG Knowledge Base & Similarity Engine

export function searchRAGChunks(query, documentChunks) {
  if (!query || !documentChunks || documentChunks.length === 0) return [];
  
  const queryTerms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  
  const scoredChunks = documentChunks.map(chunk => {
    const chunkText = (chunk.title + ' ' + chunk.text).toLowerCase();
    let matches = 0;
    
    queryTerms.forEach(term => {
      if (chunkText.includes(term)) {
        matches += 1;
      }
    });

    // Boost score if key topics match
    if (query.toLowerCase().includes('normalization') && chunkText.includes('normalization')) matches += 2;
    if (query.toLowerCase().includes('bcnf') && chunkText.includes('bcnf')) matches += 3;
    if (query.toLowerCase().includes('lossless') && chunkText.includes('lossless')) matches += 3;
    if (query.toLowerCase().includes('3nf') && chunkText.includes('3nf')) matches += 2;
    if (query.toLowerCase().includes('dependency') && chunkText.includes('dependency')) matches += 2;

    const baseScore = Math.min(0.96, 0.45 + (matches * 0.12));
    const score = matches > 0 ? parseFloat(baseScore.toFixed(2)) : 0.32;

    return {
      ...chunk,
      similarityScore: score,
      similarityPercentage: Math.round(score * 100) + '%'
    };
  });

  // Sort descending by score
  return scoredChunks.sort((a, b) => b.similarityScore - a.similarityScore);
}

export function generateRAGAnswer(query, topChunks) {
  if (!topChunks || topChunks.length === 0) {
    return {
      answer: "I couldn't find relevant passages in your uploaded notes. Could you rephrase your question?",
      citations: []
    };
  }

  const primaryChunk = topChunks[0];
  const secondaryChunk = topChunks[1] || topChunks[0];

  let answer = "";
  if (query.toLowerCase().includes('normalization') || query.toLowerCase().includes('bcnf') || query.toLowerCase().includes('3nf')) {
    answer = `Based on page ${primaryChunk.page} of your uploaded notes (${primaryChunk.title}), ${primaryChunk.text} Furthermore, ${secondaryChunk.text}`;
  } else {
    answer = `According to page ${primaryChunk.page} (${primaryChunk.title}): ${primaryChunk.text}`;
  }

  const citations = Array.from(new Set(topChunks.slice(0, 2).map(c => `DBMS Notes — Page ${c.page} (${c.title})`)));

  return {
    answer,
    citations
  };
}
