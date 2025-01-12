"""
Qwen 2.5 7B Tool Use Demo
This script demonstrates how to use tools with the Qwen model through LM Studio
"""

import json
import urllib.parse
import urllib.request
from openai import OpenAI

# Initialize LM Studio client
client = OpenAI(base_url="http://localhost:1234/v1", api_key="not-needed")
MODEL = "qwen2.5-7b-instruct"

# Example product database (in real world, this would be a proper database)
PRODUCT_DB = {
    "electronics": [
        {"name": "Dell USB Mouse", "price": 12.99},
        {"name": "Dell Keyboard Cover", "price": 19.99},
        {"name": "Dell Laptop Sleeve", "price": 24.99},
        {"name": "Dell Wireless Mouse", "price": 29.99},
        {"name": "Dell Power Bank", "price": 49.99},
    ]
}

def search_products(query: str, category: str = None, max_price: float = None) -> dict:
    """
    Search products in the catalog based on criteria
    """
    results = []
    
    # Filter by category
    products = PRODUCT_DB.get(category.lower(), []) if category else [
        p for c in PRODUCT_DB.values() for p in c
    ]
    
    # Filter by query
    query = query.lower()
    products = [p for p in products if query in p["name"].lower()]
    
    # Filter by price
    if max_price is not None:
        products = [p for p in products if p["price"] <=  max_price]
    
    return {
        "status": "success",
        "products": products,
        "total": len(products)
    }

def fetch_wikipedia_content(search_query: str) -> dict:
    """Fetches wikipedia content for a given search_query"""
    try:
        # Search for most relevant article
        search_url = "https://en.wikipedia.org/w/api.php"
        search_params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": search_query,
            "srlimit": 1,
        }

        url = f"{search_url}?{urllib.parse.urlencode(search_params)}"
        with urllib.request.urlopen(url) as response:
            search_data = json.loads(response.read().decode('utf-8'))

        if not search_data["query"]["search"]:
            return {
                "status": "error",
                "message": f"No Wikipedia article found for '{search_query}'",
            }

        # Get the normalized title from search results
        normalized_title = search_data["query"]["search"][0]["title"]

        # Now fetch the actual content with the normalized title
        content_params = {
            "action": "query",
            "format": "json",
            "titles": normalized_title,
            "prop": "extracts",
            "exintro": "true",
            "explaintext": "true",
            "redirects": 1,
        }

        url = f"{search_url}?{urllib.parse.urlencode(content_params)}"
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode('utf-8'))

        pages = data["query"]["pages"]
        page_id = list(pages.keys())[0]

        if page_id == "-1":
            return {
                "status": "error",
                "message": f"No Wikipedia article found for '{search_query}'",
            }

        content = pages[page_id]["extract"].strip()
        # Clean the content to remove problematic characters
        content = content.encode('ascii', 'ignore').decode('ascii')
        return {
            "status": "success",
            "content": content,
            "title": pages[page_id]["title"],
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

# Define tool for LM Studio
SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_products",
        "description": "Search the product catalog by various criteria. Use this whenever a customer asks about product availability, pricing, or specifications.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search terms or product name"
                },
                "category": {
                    "type": "string",
                    "description": "Product category to filter by",
                    "enum": ["electronics", "clothing", "home", "outdoor"]
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price in dollars"
                }
            },
            "required": ["query"]
        }
    }
}

# Define Wikipedia search tool
WIKI_TOOL = {
    "type": "function",
    "function": {
        "name": "fetch_wikipedia_content",
        "description": "Search Wikipedia and fetch the introduction of the most relevant article",
        "parameters": {
            "type": "object",
            "properties": {
                "search_query": {
                    "type": "string",
                    "description": "Search query for finding the Wikipedia article"
                }
            },
            "required": ["search_query"]
        }
    }
}

def process_query(query: str, use_wiki=True):
    """Process a single query"""
    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful assistant that can search Wikipedia for information. "
                "When asked about topics, people, or events, you can retrieve Wikipedia articles "
                "and provide detailed, accurate information based on them."
            ) if use_wiki else (
                "You are a helpful shopping assistant that can search for products. "
                "When asked about products, you can search the catalog and provide "
                "detailed information about availability and pricing."
            )
        },
        {"role": "user", "content": query}
    ]

    print(f"\nProcessing query: {query}")
    print("-" * 50)
    
    try:
        # Get initial response from model
        print("\nThinking...", flush=True)
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=[WIKI_TOOL if use_wiki else SEARCH_TOOL],
            stream=False  # First call without streaming to get tool calls
        )

        if response.choices[0].message.tool_calls:
            tool_calls = response.choices[0].message.tool_calls
            
            # Add tool calls to messages
            messages.append(response.choices[0].message)

            # Process each tool call
            for tool_call in tool_calls:
                args = json.loads(tool_call.function.arguments)
                
                if use_wiki:
                    print(f"\nSearching Wikipedia for: {args['search_query']}")
                    result = fetch_wikipedia_content(args["search_query"])
                    
                    # Print the Wikipedia content
                    print("\nWikipedia Article:")
                    print("-" * 40)
                    if result["status"] == "success":
                        print(f"Title: {result['title']}")
                        print("-" * 40)
                        print(result["content"])
                    else:
                        print(f"Error: {result['message']}")
                    print("-" * 40)
                else:
                    print(f"\nTool Call Arguments: {args}")
                    result = search_products(**args)
                    
                    # Print the search results
                    print("\nSearch Results:")
                    print("-" * 40)
                    if result["total"] > 0:
                        for product in result["products"]:
                            print(f"• {product['name']}: ${product['price']:.2f}")
                    else:
                        print("No products found matching your criteria.")
                    print("-" * 40)

                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "content": json.dumps(result),
                    "tool_call_id": tool_call.id,
                })

            # Get final response after tool use with streaming
            print("\nGenerating response (streaming):", flush=True)
            final_response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                stream=True
            )
            
            for chunk in final_response:
                if chunk.choices[0].delta.content:
                    print(chunk.choices[0].delta.content, end='', flush=True)
            print("\n")
            
        else:
            # If no tool calls, stream the direct response
            print("\nDirect response (streaming):", flush=True)
            for chunk in response:
                if chunk.choices[0].delta.content:
                    print(chunk.choices[0].delta.content, end='', flush=True)
            print("\n")

    except Exception as e:
        print(f"\nError: {str(e)}")
        raise

# Test the functionality
if __name__ == "__main__":
    # Test product search
    product_query = "What Dell products do you have under $30?"
    process_query(product_query, use_wiki=False)
