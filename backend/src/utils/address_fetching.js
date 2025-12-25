import axios from 'axios';

/**
 * Geokoduje adres apteki na współrzędne geograficzne.
 * 
 * @param {string} miejscowosc - Nazwa miejscowości
 * @param {string} ulica - Nazwa ulicy
 * @param {string} numerBudynku - Numer budynku
 * @param {string} kodPocztowy - Kod pocztowy
 * @returns {Promise<{lat: string, lon: string} | null>} Obiekt ze współrzędnymi lub null w przypadku błędu.
 */
async function geocodeAddress(miejscowosc, ulica, numerBudynku, kodPocztowy) {
    // Budowanie pełnego adresu z przekazanych składowych
    const address = `${ulica} ${numerBudynku}, ${kodPocztowy} ${miejscowosc}`;
    
    try {
        // Wywołanie API Nominatim (OpenStreetMap)
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                addressdetails: 1,
                limit: 1
            },
            headers: {
                'User-Agent': 'AptekON-Geocoding-Script' // Wymagane przez politykę Nominatim
            }
        });

        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            console.log(`Zgeokodowano adres: ${address} -> ${lat}, ${lon}`);
            return { lat, lon };
        } else {
            console.warn(`Nie znaleziono współrzędnych dla adresu: ${address}`);
            return { lat: null, lon: null };
        };
    } catch (error) {
        console.error('Błąd podczas geokodowania adresu:', error.message);
        return { lat: null, lon: null };
    }
}


export { geocodeAddress };
