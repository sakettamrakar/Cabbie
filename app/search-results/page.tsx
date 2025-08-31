import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SearchResults from '@/components/search/SearchResults';
import { SearchQueryParams } from '@/types/search.types';

// This function runs at build time to generate static params
// For dynamic routes with SSG, you might want to implement this
// export async function generateStaticParams() {
//   return [];
// }

// Generate metadata for better SEO
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchQueryParams;
}): Promise<Metadata> {
  const { origin = '', destination = '' } = searchParams;
  
  return {
    title: `Cabs from ${origin} to ${destination} | Cabbie`,
    description: `Find and book cabs from ${origin} to ${destination}. Compare prices, vehicle types, and book your ride in advance.`,
    openGraph: {
      title: `Cabs from ${origin} to ${destination} | Cabbie`,
      description: `Book your cab from ${origin} to ${destination} at the best prices.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Cabs from ${origin} to ${destination} | Cabbie`,
      description: `Find and book cabs from ${origin} to ${destination} at the best prices.`,
    },
  };
}

// This function fetches data on the server side
async function getSearchResults(searchParams: SearchQueryParams) {
  try {
    // In a real app, you would fetch from your API
    // For SSR, we'll return null and let the client-side fetch handle it
    // to avoid duplicating the API call
    return null;
    
    // Example of how you would fetch data:
    /*
    const query = new URLSearchParams({
      origin: searchParams.origin,
      destination: searchParams.destination,
      datetime: searchParams.pickup_datetime,
      ...(searchParams.return_datetime && { return_datetime: searchParams.return_datetime }),
      ...(searchParams.passengers && { passengers: searchParams.passengers }),
      ...(searchParams.luggage && { luggage: searchParams.luggage })
    });
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes?${query}`, {
      // We don't want to cache this response as it's user-specific
      cache: 'no-store',
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch results');
    }
    
    return await res.json();
    */
  } catch (error) {
    console.error('Error fetching search results:', error);
    return null;
  }
}

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: SearchQueryParams;
}) {
  // Validate required search params
  if (!searchParams.origin || !searchParams.destination || !searchParams.pickup_datetime) {
    // Redirect to home page or show error if required params are missing
    notFound();
  }

  // Fetch data on the server side (optional - can be done client-side only)
  const initialData = await getSearchResults(searchParams);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <SearchResults 
          initialData={initialData}
          searchParams={searchParams}
        />
      </div>
    </main>
  );
}
