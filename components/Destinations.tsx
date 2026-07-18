import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DESTINATIONS, type Destination } from '../data/mapDestinations';
import { DestinationsView } from './destinations/DestinationsView';
import { useDestinationMap } from './destinations/useDestinationMap';

/**
 * Destinations Component - Optimized with React.memo
 *
 * PERFORMANCE WIN: Prevents the entire Destinations section from re-rendering when parent state changes.
 * This is particularly important because this component initializes a Leaflet map and
 * iterates over a large set of destination markers and cards.
 */
const Destinations = memo(() => {
    const destinationModalRef = useRef<HTMLDialogElement>(null);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);

    const filteredDestinations = useMemo(() => {
        if (activeFilter === 'Todos') return DESTINATIONS;
        return DESTINATIONS.filter(destination => destination.continent === activeFilter);
    }, [activeFilter]);

    const closeModal = useCallback(() => setSelectedDestination(null), []);
    const { mapRef, handleZoom } = useDestinationMap(filteredDestinations, setSelectedDestination);

    useEffect(() => {
        const dialog = destinationModalRef.current;
        if (!dialog) return;

        if (selectedDestination && !dialog.open) {
            dialog.showModal();
        } else if (!selectedDestination && dialog.open) {
            dialog.close();
        }
    }, [selectedDestination]);

    useEffect(() => {
        const dialog = destinationModalRef.current;
        if (!dialog) return;

        const handleCancel = (event: Event) => {
            event.preventDefault();
            closeModal();
        };

        const handleClick = (event: MouseEvent) => {
            if (event.target === dialog) closeModal();
        };

        dialog.addEventListener('cancel', handleCancel);
        dialog.addEventListener('click', handleClick);
        return () => {
            dialog.removeEventListener('cancel', handleCancel);
            dialog.removeEventListener('click', handleClick);
        };
    }, [closeModal]);

    return (
        <DestinationsView
            activeFilter={activeFilter}
            filteredDestinations={filteredDestinations}
            selectedDestination={selectedDestination}
            mapRef={mapRef}
            destinationModalRef={destinationModalRef}
            onFilterChange={setActiveFilter}
            onDestinationSelect={setSelectedDestination}
            onCloseModal={closeModal}
            onZoom={handleZoom}
        />
    );
});

Destinations.displayName = 'Destinations';

export default Destinations;
