'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
// Lightweight debounce hook to avoid dependency on external hook module
function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}
const CAR_TYPES = [
    { id: 'hatchback', label: 'Hatchback' },
    { id: 'sedan', label: 'Sedan' },
    { id: 'suv', label: 'SUV' },
    { id: 'luxury', label: 'Luxury' },
    { id: 'minivan', label: 'Minivan' },
];
const SORT_OPTIONS = [
    { id: 'price_asc', label: 'Price: Low to High', value: 'price_asc' },
    { id: 'price_desc', label: 'Price: High to Low', value: 'price_desc' },
    { id: 'capacity_asc', label: 'Seats: Low to High', value: 'capacity_asc' },
    { id: 'capacity_desc', label: 'Seats: High to Low', value: 'capacity_desc' },
];
export function FilterSidebar({ priceRange, onFilterChange, className = '' }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [filters, setFilters] = useState({
        carTypes: [],
        priceRange: [0, 10000],
        minCapacity: 1,
        instantConfirmation: false,
        freeCancellation: false,
    });
    const [sortBy, setSortBy] = useState('price_asc');
    const debouncedFilters = useDebounce(filters, 300);
    // Initialize filters from URL
    useEffect(() => {
        var _a;
        const params = new URLSearchParams((_a = searchParams === null || searchParams === void 0 ? void 0 : searchParams.toString()) !== null && _a !== void 0 ? _a : undefined);
        setFilters(prev => {
            var _a;
            return ({
                ...prev,
                carTypes: ((_a = params.get('car_type')) === null || _a === void 0 ? void 0 : _a.split(',')) || [],
                priceRange: [
                    parseInt(params.get('min_price') || '0'),
                    Math.min(parseInt(params.get('max_price') || '10000'), 10000)
                ],
                minCapacity: parseInt(params.get('min_capacity') || '1'),
                instantConfirmation: params.get('instant_confirmation') === 'true',
                freeCancellation: params.get('free_cancellation') === 'true',
            });
        });
        if (params.has('sort_by')) {
            setSortBy(params.get('sort_by'));
        }
    }, [searchParams]);
    // Update URL when filters change
    useEffect(() => {
        var _a;
        const params = new URLSearchParams((_a = searchParams === null || searchParams === void 0 ? void 0 : searchParams.toString()) !== null && _a !== void 0 ? _a : undefined);
        // Update car types
        if (filters.carTypes.length > 0) {
            params.set('car_type', filters.carTypes.join(','));
        }
        else {
            params.delete('car_type');
        }
        // Update price range
        params.set('min_price', filters.priceRange[0].toString());
        params.set('max_price', filters.priceRange[1].toString());
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
        // Update instant confirmation
        if (filters.instantConfirmation) {
            params.set('instant_confirmation', 'true');
        }
        else {
            params.delete('instant_confirmation');
        }
        // Update free cancellation
        if (filters.freeCancellation) {
            params.set('free_cancellation', 'true');
        }
        else {
            params.delete('free_cancellation');
        }
        // Update URL without page reload
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        // Notify parent component
        onFilterChange(filters);
    }, [debouncedFilters, sortBy, filters, onFilterChange, pathname, router, searchParams]);
    const handleCarTypeChange = (carType, checked) => {
        setFilters(prev => ({
            ...prev,
            carTypes: checked
                ? [...prev.carTypes, carType]
                : prev.carTypes.filter(type => type !== carType)
        }));
    };
    const handlePriceChange = (value) => {
        setFilters(prev => ({
            ...prev,
            priceRange: [value[0], value[1]]
        }));
    };
    const handleCapacityChange = (e) => {
        setFilters(prev => ({
            ...prev,
            minCapacity: parseInt(e.target.value)
        }));
    };
    const handleSortChange = (value) => {
        setSortBy(value);
    };
    const resetFilters = () => {
        setFilters({
            carTypes: [],
            priceRange: [0, 10000],
            minCapacity: 1,
            instantConfirmation: false,
            freeCancellation: false,
        });
        setSortBy('price_asc');
    };
    return (<aside className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
          Reset all
        </button>
      </div>
      
      {/* Car Types */}
      <div className="space-y-3">
        <h3 className="font-medium">Car Type</h3>
        <div className="space-y-2">
          {CAR_TYPES.map(({ id, label }) => (<div key={id} className="flex items-center space-x-2">
              <input type="checkbox" id={`car-type-${id}`} checked={filters.carTypes.includes(id)} onChange={(e) => handleCarTypeChange(id, e.currentTarget.checked)} className="h-4 w-4"/>
              <label htmlFor={`car-type-${id}`} className="text-sm font-normal">
                {label}
              </label>
            </div>))}
        </div>
      </div>
      
      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-medium">Price Range</h3>
        <div className="px-2 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="min-price" className="block text-sm text-gray-600">Min</label>
              <input id="min-price" type="number" min={0} max={filters.priceRange[1]} step={100} value={filters.priceRange[0]} onChange={(e) => handlePriceChange([Math.max(0, Math.min(Number(e.target.value), filters.priceRange[1])), filters.priceRange[1]])} className="w-full p-2 border rounded-md text-sm"/>
            </div>
            <div>
              <label htmlFor="max-price" className="block text-sm text-gray-600">Max</label>
              <input id="max-price" type="number" min={filters.priceRange[0]} max={10000} step={100} value={filters.priceRange[1]} onChange={(e) => handlePriceChange([filters.priceRange[0], Math.min(10000, Math.max(Number(e.target.value), filters.priceRange[0]))])} className="w-full p-2 border rounded-md text-sm"/>
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{filters.priceRange[0].toLocaleString()}</span>
            <span>₹{filters.priceRange[1].toLocaleString()}+</span>
          </div>
        </div>
      </div>
      
      {/* Seating Capacity */}
      <div className="space-y-3">
        <h3 className="font-medium">Minimum Seats</h3>
        <select value={filters.minCapacity} onChange={handleCapacityChange} className="w-full p-2 border rounded-md text-sm">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (<option key={num} value={num}>
              {num}+ {num === 1 ? 'Seat' : 'Seats'}
            </option>))}
        </select>
      </div>
      
      {/* Additional Filters */}
      <div className="space-y-3">
        <h3 className="font-medium">Options</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="instant-confirmation" checked={filters.instantConfirmation} onChange={(e) => setFilters(prev => ({
            ...prev,
            instantConfirmation: e.currentTarget.checked
        }))} className="h-4 w-4"/>
            <label htmlFor="instant-confirmation" className="text-sm font-normal">
              Instant Confirmation
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="free-cancellation" checked={filters.freeCancellation} onChange={(e) => setFilters(prev => ({
            ...prev,
            freeCancellation: e.currentTarget.checked
        }))} className="h-4 w-4"/>
            <label htmlFor="free-cancellation" className="text-sm font-normal">
              Free Cancellation
            </label>
          </div>
        </div>
      </div>
      
      {/* Sorting */}
      <div className="space-y-3">
        <h3 className="font-medium">Sort By</h3>
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => (<div key={option.id} className="flex items-center space-x-2">
              <input type="radio" id={`sort-${option.id}`} name="sort" checked={sortBy === option.value} onChange={() => handleSortChange(option.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500"/>
              <label htmlFor={`sort-${option.id}`} className="text-sm font-normal">
                {option.label}
              </label>
            </div>))}
        </div>
      </div>
    </aside>);
}
