interface WikipediaSearchResponse {
  status: 'success' | 'error';
  content?: string;
  title?: string;
  message?: string;
}

export async function wikipediaSearch(args: { query: string }): Promise<WikipediaSearchResponse> {
  try {
    // Search for most relevant article
    const searchUrl = "https://en.wikipedia.org/w/api.php";
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      list: "search",
      srsearch: args.query,
      srlimit: "1",
    });

    const searchResponse = await fetch(`${searchUrl}?${searchParams}`);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) {
      return {
        status: 'error',
        message: `No Wikipedia article found for '${args.query}'`,
      };
    }

    // Get the normalized title from search results
    const normalizedTitle = searchData.query.search[0].title;

    // Now fetch the actual content
    const contentParams = new URLSearchParams({
      action: "query",
      format: "json",
      titles: normalizedTitle,
      prop: "extracts",
      exintro: "true",
      explaintext: "true",
      redirects: "1",
    });

    const contentResponse = await fetch(`${searchUrl}?${contentParams}`);
    const data = await contentResponse.json();

    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId === "-1") {
      return {
        status: 'error',
        message: `No Wikipedia article found for '${args.query}'`,
      };
    }

    const content = pages[pageId].extract.trim();
    
    return {
      status: 'success',
      content,
      title: pages[pageId].title,
    };

  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
