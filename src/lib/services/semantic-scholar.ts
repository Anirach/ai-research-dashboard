export interface SemanticScholarPaper {
  paperId: string;
  externalIds?: {
    ArXiv?: string;
    DOI?: string;
  };
  title: string;
  abstract?: string;
  authors: { authorId: string; name: string }[];
  year?: number;
  citationCount?: number;
  referenceCount?: number;
  url?: string;
  fieldsOfStudy?: string[];
  citations?: SemanticScholarPaper[];
  references?: SemanticScholarPaper[];
}

interface SearchResult {
  total: number;
  offset: number;
  data: SemanticScholarPaper[];
}

const BASE_URL = "https://api.semanticscholar.org/graph/v1";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  return headers;
}

export async function searchPapers(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    fields?: string[];
  } = {}
): Promise<SearchResult> {
  const { limit = 20, offset = 0, fields = ["title", "abstract", "authors", "year", "citationCount", "url", "externalIds"] } = options;

  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    offset: offset.toString(),
    fields: fields.join(","),
  });

  const response = await fetch(`${BASE_URL}/paper/search?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Semantic Scholar API error: ${response.status}`);
  }

  return response.json();
}

export async function getPaperDetails(
  paperId: string,
  fields: string[] = [
    "title",
    "abstract",
    "authors",
    "year",
    "citationCount",
    "referenceCount",
    "url",
    "externalIds",
    "fieldsOfStudy",
  ]
): Promise<SemanticScholarPaper | null> {
  const params = new URLSearchParams({
    fields: fields.join(","),
  });

  const response = await fetch(`${BASE_URL}/paper/${paperId}?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Semantic Scholar API error: ${response.status}`);
  }

  return response.json();
}

export async function getPaperByArxivId(arxivId: string): Promise<SemanticScholarPaper | null> {
  const cleanId = arxivId.replace("arXiv:", "").replace("arxiv:", "");
  return getPaperDetails(`arXiv:${cleanId}`);
}

export async function getCitations(
  paperId: string,
  options: {
    limit?: number;
    offset?: number;
    fields?: string[];
  } = {}
): Promise<{ data: { citingPaper: SemanticScholarPaper }[]; offset: number; next?: number }> {
  const { limit = 50, offset = 0, fields = ["title", "abstract", "authors", "year", "citationCount", "externalIds"] } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    fields: fields.join(","),
  });

  const response = await fetch(`${BASE_URL}/paper/${paperId}/citations?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Semantic Scholar API error: ${response.status}`);
  }

  return response.json();
}

export async function getReferences(
  paperId: string,
  options: {
    limit?: number;
    offset?: number;
    fields?: string[];
  } = {}
): Promise<{ data: { citedPaper: SemanticScholarPaper }[]; offset: number; next?: number }> {
  const { limit = 50, offset = 0, fields = ["title", "abstract", "authors", "year", "citationCount", "externalIds"] } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    fields: fields.join(","),
  });

  const response = await fetch(`${BASE_URL}/paper/${paperId}/references?${params}`, {
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Semantic Scholar API error: ${response.status}`);
  }

  return response.json();
}

export async function buildCitationNetwork(
  arxivIds: string[],
  depth: number = 1
): Promise<{
  nodes: { id: string; arxivId?: string; title: string; citationCount?: number }[];
  links: { source: string; target: string }[];
}> {
  const nodes: Map<string, { id: string; arxivId?: string; title: string; citationCount?: number }> = new Map();
  const links: { source: string; target: string }[] = [];
  const visited = new Set<string>();

  async function processPaper(arxivId: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(arxivId)) return;
    visited.add(arxivId);

    try {
      const paper = await getPaperByArxivId(arxivId);
      if (!paper) return;

      nodes.set(paper.paperId, {
        id: paper.paperId,
        arxivId: paper.externalIds?.ArXiv,
        title: paper.title,
        citationCount: paper.citationCount,
      });

      if (currentDepth < depth) {
        const [citationsResult, referencesResult] = await Promise.all([
          getCitations(paper.paperId, { limit: 10 }),
          getReferences(paper.paperId, { limit: 10 }),
        ]);

        for (const { citingPaper } of citationsResult.data) {
          if (citingPaper && citingPaper.paperId) {
            nodes.set(citingPaper.paperId, {
              id: citingPaper.paperId,
              arxivId: citingPaper.externalIds?.ArXiv,
              title: citingPaper.title,
              citationCount: citingPaper.citationCount,
            });
            links.push({ source: citingPaper.paperId, target: paper.paperId });
          }
        }

        for (const { citedPaper } of referencesResult.data) {
          if (citedPaper && citedPaper.paperId) {
            nodes.set(citedPaper.paperId, {
              id: citedPaper.paperId,
              arxivId: citedPaper.externalIds?.ArXiv,
              title: citedPaper.title,
              citationCount: citedPaper.citationCount,
            });
            links.push({ source: paper.paperId, target: citedPaper.paperId });
          }
        }
      }
    } catch (error) {
      console.error(`Error processing paper ${arxivId}:`, error);
    }
  }

  await Promise.all(arxivIds.map((id) => processPaper(id, 0)));

  return {
    nodes: Array.from(nodes.values()),
    links,
  };
}
