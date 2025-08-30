"use client";
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
export function useSearchResults(initialData) {
    const searchParams = useSearchParams();
    const [results, setResults] = useState(initialData);
    const [filteredResults, setFilteredResults] = useState([]);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        carTypes: [],
        priceRange: [0, 10000],
        minCapacity: 1,
        instantConfirmation: false,
        freeCancellation: false,
    });
    const [sortBy, setSortBy] = useState('price_asc');
    // Fetch results if not provided via SSR
    useEffect(() => {
        const fetchResults = async () => {
            if (initialData)
                return;
            setIsLoading(true);
            setError(null);
            try {
                const origin = (searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('origin')) || '';
                const destination = (searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('destination')) || '';
                const datetime = (searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('pickup_datetime')) || '';
                const returnDt = (searchParams === null || searchParams === void 0 ? void 0 : searchParams.get('return_datetime')) || '';
                const query = new URLSearchParams({
                    origin,
                    destination,
                    datetime,
                    ...(returnDt && { return_datetime: returnDt }),
                });
                const response = await fetch(`/api/quotes?${query}`, {
                    next: { revalidate: 300 } // Cache for 5 minutes
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch results');
                }
                const data = await response.json();
                setResults(data);
            }
            catch (err) {
                console.error('Error fetching search results:', err);
                setError('Failed to load search results. Please try again.');
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchResults();
    }, [initialData, searchParams]);
    // Apply filters and sorting
    const applyFilters = useCallback((results) => {
        if (!results)
            return [];
        let filtered = [...results.cabOptions];
        // Apply car type filter
        if (filters.carTypes.length > 0) {
            filtered = filtered.filter(cab => filters.carTypes.includes(cab.carType));
        }
        // Apply price range filter
        filtered = filtered.filter(cab => cab.price >= filters.priceRange[0] &&
            cab.price <= filters.priceRange[1]);
        // Apply capacity filter
        filtered = filtered.filter(cab => cab.capacity >= filters.minCapacity);
        // Apply instant confirmation filter
        if (filters.instantConfirmation) {
            filtered = filtered.filter(cab => cab.instantConfirmation);
        }
        // Apply free cancellation filter
        if (filters.freeCancellation) {
            filtered = filtered.filter(cab => cab.cancellationPolicy === 'free');
        }
        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'price_asc':
                    return a.price - b.price;
                case 'price_desc':
                    return b.price - a.price;
                case 'capacity_asc':
                    return a.capacity - b.capacity;
                case 'capacity_desc':
                    return b.capacity - a.capacity;
                default:
                    return 0;
            }
        });
        return filtered;
    }, [filters, sortBy]);
    // Update filtered results when results or filters change
    useEffect(() => {
        if (results) {
            const filtered = applyFilters(results);
            setFilteredResults(filtered);
        }
    }, [results, applyFilters]);
    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        // Update car types
        if (filters.carTypes.length > 0) {
            params.set('car_type', filters.carTypes.join(','));
        }
        else {
            params.delete('car_type');
        }
        // Update price range
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
            params.set('min_price', filters.priceRange[0].toString());
            params.set('max_price', filters.priceRange[1].toString());
        }
        else {
            params.delete('min_price');
            params.delete('max_price');
        }
        // Update capacity
        if (filters.minCapacity > 1) {
            params.set('min_capacity', filters.minCapacity.toString());
        }
        else {
            params.delete('min_capacity');
        }
        // Update sort
        if (sortBy !== 'price_asc') {
            params.set('sort_by', sortBy);
        }
        else {
            params.delete('sort_by');
        }
        // Update URL without page reload
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }, [filters, sortBy]);
    // Count active filters for the mobile filter badge
    const activeFilterCount = [
        filters.carTypes.length > 0 ? 1 : 0,
        filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ? 1 : 0,
        filters.minCapacity > 1 ? 1 : 0,
        filters.instantConfirmation ? 1 : 0,
        filters.freeCancellation ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0);
    return {
        results,
        filteredResults,
        isLoading,
        error,
        filters,
        setFilters,
        sortBy,
        setSortBy,
        activeFilterCount,
    };
}
