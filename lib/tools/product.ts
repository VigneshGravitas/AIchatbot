import { db } from '@/lib/db';
import { product } from '@/lib/db/schema';
import { ilike, and, lte, eq, sql } from 'drizzle-orm';
import type { Product, ProductSearchResponse } from '@/lib/types';

interface ProductSearchArgs {
  query: string;
  category?: string;
  maxPrice?: number;
}

export async function productSearch(args: ProductSearchArgs): Promise<ProductSearchResponse> {
  try {
    let conditions = [];
    const query = args.query.toLowerCase();

    // Handle "show all laptops" case
    if (query.includes('show all') || query.includes('show me all')) {
      conditions = [ilike(product.category, 'Laptops')];
    } else {
      // Always add category condition for laptops
      conditions.push(ilike(product.category, 'Laptops'));

      // Parse price from query FIRST to ensure it's applied
      const priceMatch = query.match(/under \$?(\d+)/i);
      if (priceMatch) {
        const maxPrice = parseFloat(priceMatch[1]);
        conditions.push(sql`CAST(${product.price} AS DECIMAL) <= ${maxPrice}`);
      }

      // Check for processor type (case-insensitive)
      if (query.includes('core i5') || query.includes('intel core i5')) {
        conditions.push(ilike(product.description, '%Core i5%'));
      } else if (query.includes('core i3') || query.includes('intel core i3')) {
        conditions.push(ilike(product.description, '%Core i3%'));
      } else if (query.includes('core i7') || query.includes('intel core i7')) {
        conditions.push(ilike(product.description, '%Core i7%'));
      } else if (query.includes('ryzen')) {
        conditions.push(ilike(product.description, '%Ryzen%'));
      }

      // Extract brand names
      const brands = ['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer'];
      const brandMatch = brands.find(brand => query.includes(brand.toLowerCase()));
      if (brandMatch) {
        conditions.push(ilike(product.name, `%${brandMatch}%`));
      }

      // If no specific conditions were added, search by name
      if (conditions.length === 1) {
        conditions.push(ilike(product.name, `%${args.query}%`));
      }
    }

    // Execute query with all conditions using AND
    const products = await db
      .select()
      .from(product)
      .where(and(...conditions))
      .orderBy(product.price);

    return {
      status: 'success',
      products: products.map(p => ({
        id: Number(p.id),
        name: p.name,
        price: Number(p.price),
        category: p.category,
        description: p.description || undefined
      })),
      total: products.length
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to search products'
    };
  }
}
