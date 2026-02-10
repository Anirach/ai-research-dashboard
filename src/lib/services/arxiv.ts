import { parseStringPromise } from "xml2js";

export interface ArxivPaper {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  pdfUrl: string;
  publishedAt: Date;
  categories: string[];
}

interface ArxivEntry {
  id: string[];
  title: string[];
  summary: string[];
  author: { name: string[] }[];
  published: string[];
  link: { $: { href: string; title?: string; type?: string } }[];
  category: { $: { term: string } }[];
}

interface ArxivFeed {
  feed: {
    entry?: ArxivEntry[];
    "opensearch:totalResults"?: { _: string }[];
  };
}

const ARXIV_API_URL = "https://export.arxiv.org/api/query";

const AI_CATEGORIES = ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE", "stat.ML"];

export async function fetchArxivPapers(options: {
  categories?: string[];
  keywords?: string[];
  maxResults?: number;
  start?: number;
  sortBy?: "relevance" | "lastUpdatedDate" | "submittedDate";
  sortOrder?: "ascending" | "descending";
}): Promise<{ papers: ArxivPaper[]; totalResults: number }> {
  const {
    categories = AI_CATEGORIES,
    keywords = [],
    maxResults = 50,
    start = 0,
    sortBy = "submittedDate",
    sortOrder = "descending",
  } = options;

  const categoryQuery = categories.map((cat) => `cat:${cat}`).join("+OR+");
  let searchQuery = `(${categoryQuery})`;

  if (keywords.length > 0) {
    const keywordQuery = keywords
      .map((kw) => `all:${encodeURIComponent(kw)}`)
      .join("+OR+");
    searchQuery = `${searchQuery}+AND+(${keywordQuery})`;
  }

  const params = new URLSearchParams({
    search_query: searchQuery,
    start: start.toString(),
    max_results: maxResults.toString(),
    sortBy,
    sortOrder,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(`${ARXIV_API_URL}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();
    const result = (await parseStringPromise(xml)) as ArxivFeed;

    const entries = result.feed.entry || [];
    const totalResults = result.feed["opensearch:totalResults"]
      ? parseInt(result.feed["opensearch:totalResults"][0]._ || "0")
      : 0;

    const papers: ArxivPaper[] = entries.map((entry) => {
      const arxivId = extractArxivId(entry.id[0]);
      const pdfLink = entry.link.find((l) => l.$.title === "pdf");
      const abstractLink = entry.link.find((l) => l.$.type === "text/html");

      return {
        arxivId,
        title: cleanText(entry.title[0]),
        authors: entry.author.map((a) => a.name[0]),
        abstract: cleanText(entry.summary[0]),
        url: abstractLink?.$.href || `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: pdfLink?.$.href || `https://arxiv.org/pdf/${arxivId}.pdf`,
        publishedAt: new Date(entry.published[0]),
        categories: entry.category.map((c) => c.$.term),
      };
    });

    return { papers, totalResults };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('arXiv API request timed out after 8 seconds');
    }
    throw error;
  }
}

export async function fetchTodaysPapers(
  categories: string[] = AI_CATEGORIES,
  keywords: string[] = []
): Promise<ArxivPaper[]> {
  const { papers } = await fetchArxivPapers({
    categories,
    keywords,
    maxResults: 100,
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return papers.filter((paper) => {
    const paperDate = new Date(paper.publishedAt);
    return paperDate >= yesterday;
  });
}

export async function searchArxivPapers(
  query: string,
  maxResults: number = 50
): Promise<ArxivPaper[]> {
  const params = new URLSearchParams({
    search_query: `all:${encodeURIComponent(query)}`,
    start: "0",
    max_results: maxResults.toString(),
    sortBy: "relevance",
    sortOrder: "descending",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(`${ARXIV_API_URL}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();
    const result = (await parseStringPromise(xml)) as ArxivFeed;

    const entries = result.feed.entry || [];

    return entries.map((entry) => {
      const arxivId = extractArxivId(entry.id[0]);
      const pdfLink = entry.link.find((l) => l.$.title === "pdf");
      const abstractLink = entry.link.find((l) => l.$.type === "text/html");

      return {
        arxivId,
        title: cleanText(entry.title[0]),
        authors: entry.author.map((a) => a.name[0]),
        abstract: cleanText(entry.summary[0]),
        url: abstractLink?.$.href || `https://arxiv.org/abs/${arxivId}`,
        pdfUrl: pdfLink?.$.href || `https://arxiv.org/pdf/${arxivId}.pdf`,
        publishedAt: new Date(entry.published[0]),
        categories: entry.category.map((c) => c.$.term),
      };
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('arXiv API request timed out after 8 seconds');
    }
    throw error;
  }
}

export async function fetchPaperByArxivId(arxivId: string): Promise<ArxivPaper | null> {
  const cleanId = arxivId.replace("arXiv:", "").replace("arxiv:", "");

  const params = new URLSearchParams({
    id_list: cleanId,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const response = await fetch(`${ARXIV_API_URL}?${params}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();
    const result = (await parseStringPromise(xml)) as ArxivFeed;

    const entries = result.feed.entry || [];
    if (entries.length === 0) {
      return null;
    }

    const entry = entries[0];
    const pdfLink = entry.link.find((l) => l.$.title === "pdf");
    const abstractLink = entry.link.find((l) => l.$.type === "text/html");

    return {
      arxivId: cleanId,
      title: cleanText(entry.title[0]),
      authors: entry.author.map((a) => a.name[0]),
      abstract: cleanText(entry.summary[0]),
      url: abstractLink?.$.href || `https://arxiv.org/abs/${cleanId}`,
      pdfUrl: pdfLink?.$.href || `https://arxiv.org/pdf/${cleanId}.pdf`,
      publishedAt: new Date(entry.published[0]),
      categories: entry.category.map((c) => c.$.term),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('arXiv API request timed out after 8 seconds');
    }
    throw error;
  }
}

function extractArxivId(url: string): string {
  const match = url.match(/(\d{4}\.\d{4,5})(v\d+)?$/);
  if (match) {
    return match[1];
  }
  const oldMatch = url.match(/abs\/([^/]+)$/);
  return oldMatch ? oldMatch[1] : url;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export const CATEGORY_LABELS: Record<string, string> = {
  "cs.AI": "Artificial Intelligence",
  "cs.LG": "Machine Learning",
  "cs.CL": "Computation and Language",
  "cs.CV": "Computer Vision",
  "cs.NE": "Neural and Evolutionary Computing",
  "stat.ML": "Machine Learning (Stats)",
};
