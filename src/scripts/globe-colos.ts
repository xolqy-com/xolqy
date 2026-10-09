/**
 * A subset of Cloudflare data centre codes (IATA airport codes) with approximate
 * coordinates, used only to place the "served from" pin on the homepage globe.
 * Not the full network: an unknown code still shows as text, just without a pin.
 * Coordinates are the airport's, rounded; they are for drawing, not for routing.
 */
export type Colo = readonly [code: string, city: string, lat: number, lon: number];

export const COLOS: readonly Colo[] = [
  // Europe
  ['ATH', 'Athens', 37.94, 23.94], ['SKG', 'Thessaloniki', 40.52, 22.97], ['HER', 'Heraklion', 35.34, 25.18],
  ['LHR', 'London', 51.47, -0.45], ['MAN', 'Manchester', 53.35, -2.27], ['EDI', 'Edinburgh', 55.95, -3.37],
  ['DUB', 'Dublin', 53.42, -6.27], ['CDG', 'Paris', 49.01, 2.55], ['MRS', 'Marseille', 43.44, 5.22],
  ['FRA', 'Frankfurt', 50.03, 8.57], ['MUC', 'Munich', 48.35, 11.79], ['HAM', 'Hamburg', 53.63, 9.99],
  ['DUS', 'Düsseldorf', 51.29, 6.77], ['TXL', 'Berlin', 52.37, 13.5], ['AMS', 'Amsterdam', 52.31, 4.76],
  ['BRU', 'Brussels', 50.9, 4.48], ['LUX', 'Luxembourg', 49.63, 6.21], ['ZRH', 'Zurich', 47.46, 8.55],
  ['GVA', 'Geneva', 46.24, 6.11], ['VIE', 'Vienna', 48.11, 16.57], ['PRG', 'Prague', 50.1, 14.26],
  ['WAW', 'Warsaw', 52.17, 20.97], ['BUD', 'Budapest', 47.44, 19.26], ['OTP', 'Bucharest', 44.57, 26.08],
  ['SOF', 'Sofia', 42.7, 23.41], ['BEG', 'Belgrade', 44.82, 20.31], ['ZAG', 'Zagreb', 45.74, 16.07],
  ['MXP', 'Milan', 45.63, 8.72], ['FCO', 'Rome', 41.8, 12.25], ['PMO', 'Palermo', 38.18, 13.1],
  ['MAD', 'Madrid', 40.47, -3.57], ['BCN', 'Barcelona', 41.3, 2.08], ['LIS', 'Lisbon', 38.77, -9.13],
  ['CPH', 'Copenhagen', 55.62, 12.65], ['ARN', 'Stockholm', 59.65, 17.92], ['OSL', 'Oslo', 60.19, 11.1],
  ['HEL', 'Helsinki', 60.32, 24.96], ['RIX', 'Riga', 56.92, 23.97], ['VNO', 'Vilnius', 54.63, 25.29],
  ['TLL', 'Tallinn', 59.41, 24.83], ['KBP', 'Kyiv', 50.35, 30.89], ['KIV', 'Chișinău', 46.93, 28.93],
  ['IST', 'Istanbul', 41.26, 28.74], ['LCA', 'Larnaca', 34.88, 33.63], ['MLA', 'Malta', 35.86, 14.48],
  ['TIA', 'Tirana', 41.41, 19.72], ['SKP', 'Skopje', 41.96, 21.62],
  // Middle East and Africa
  ['TLV', 'Tel Aviv', 32.01, 34.89], ['AMM', 'Amman', 31.72, 35.99], ['DXB', 'Dubai', 25.25, 55.36],
  ['DOH', 'Doha', 25.27, 51.61], ['BAH', 'Bahrain', 26.27, 50.63], ['RUH', 'Riyadh', 24.96, 46.7],
  ['JED', 'Jeddah', 21.68, 39.16], ['KWI', 'Kuwait', 29.24, 47.97], ['MCT', 'Muscat', 23.59, 58.28],
  ['CAI', 'Cairo', 30.12, 31.41], ['CMN', 'Casablanca', 33.37, -7.59], ['ALG', 'Algiers', 36.69, 3.22],
  ['TUN', 'Tunis', 36.85, 10.23], ['LOS', 'Lagos', 6.58, 3.32], ['ACC', 'Accra', 5.6, -0.17],
  ['DKR', 'Dakar', 14.74, -17.49], ['NBO', 'Nairobi', -1.32, 36.93], ['ADD', 'Addis Ababa', 8.98, 38.8],
  ['DAR', 'Dar es Salaam', -6.88, 39.2], ['KGL', 'Kigali', -1.97, 30.14], ['JNB', 'Johannesburg', -26.14, 28.24],
  ['CPT', 'Cape Town', -33.97, 18.6], ['DUR', 'Durban', -29.61, 31.12], ['MRU', 'Mauritius', -20.43, 57.68],
  // Asia Pacific
  ['BOM', 'Mumbai', 19.09, 72.87], ['DEL', 'New Delhi', 28.56, 77.1], ['BLR', 'Bangalore', 13.2, 77.71],
  ['MAA', 'Chennai', 12.99, 80.17], ['HYD', 'Hyderabad', 17.24, 78.43], ['CCU', 'Kolkata', 22.65, 88.45],
  ['KHI', 'Karachi', 24.91, 67.16], ['DAC', 'Dhaka', 23.84, 90.4], ['CMB', 'Colombo', 7.18, 79.88],
  ['KTM', 'Kathmandu', 27.7, 85.36], ['SIN', 'Singapore', 1.36, 103.99], ['KUL', 'Kuala Lumpur', 2.75, 101.71],
  ['BKK', 'Bangkok', 13.69, 100.75], ['SGN', 'Ho Chi Minh City', 10.82, 106.65], ['HAN', 'Hanoi', 21.22, 105.81],
  ['MNL', 'Manila', 14.51, 121.02], ['CGK', 'Jakarta', -6.13, 106.66], ['HKG', 'Hong Kong', 22.31, 113.91],
  ['TPE', 'Taipei', 25.08, 121.23], ['NRT', 'Tokyo', 35.77, 140.39], ['KIX', 'Osaka', 34.43, 135.24],
  ['FUK', 'Fukuoka', 33.59, 130.45], ['ICN', 'Seoul', 37.46, 126.44], ['ULN', 'Ulaanbaatar', 47.84, 106.77],
  ['SYD', 'Sydney', -33.95, 151.18], ['MEL', 'Melbourne', -37.67, 144.84], ['BNE', 'Brisbane', -27.38, 153.12],
  ['PER', 'Perth', -31.94, 115.97], ['ADL', 'Adelaide', -34.95, 138.53], ['AKL', 'Auckland', -37.01, 174.79],
  ['NOU', 'Nouméa', -22.01, 166.21], ['GUM', 'Guam', 13.48, 144.8],
  // Americas
  ['IAD', 'Ashburn', 38.95, -77.46], ['EWR', 'Newark', 40.69, -74.17], ['JFK', 'New York', 40.64, -73.78],
  ['BOS', 'Boston', 42.36, -71.01], ['PHL', 'Philadelphia', 39.87, -75.24], ['ATL', 'Atlanta', 33.64, -84.43],
  ['MIA', 'Miami', 25.79, -80.29], ['TPA', 'Tampa', 27.98, -82.53], ['ORD', 'Chicago', 41.97, -87.91],
  ['DTW', 'Detroit', 42.21, -83.35], ['MSP', 'Minneapolis', 44.88, -93.22], ['STL', 'St. Louis', 38.75, -90.37],
  ['MCI', 'Kansas City', 39.3, -94.71], ['DFW', 'Dallas', 32.9, -97.04], ['IAH', 'Houston', 29.98, -95.34],
  ['AUS', 'Austin', 30.19, -97.67], ['DEN', 'Denver', 39.86, -104.67], ['PHX', 'Phoenix', 33.43, -112.01],
  ['SLC', 'Salt Lake City', 40.79, -111.98], ['LAS', 'Las Vegas', 36.08, -115.15], ['LAX', 'Los Angeles', 33.94, -118.41],
  ['SAN', 'San Diego', 32.73, -117.19], ['SJC', 'San Jose', 37.36, -121.93], ['SFO', 'San Francisco', 37.62, -122.38],
  ['SEA', 'Seattle', 47.45, -122.31], ['PDX', 'Portland', 45.59, -122.6], ['HNL', 'Honolulu', 21.32, -157.92],
  ['ANC', 'Anchorage', 61.17, -149.99], ['YYZ', 'Toronto', 43.68, -79.63], ['YUL', 'Montréal', 45.47, -73.74],
  ['YVR', 'Vancouver', 49.19, -123.18], ['YYC', 'Calgary', 51.13, -114.01], ['YWG', 'Winnipeg', 49.91, -97.24],
  ['MEX', 'Mexico City', 19.44, -99.07], ['QRO', 'Querétaro', 20.62, -100.19], ['GDL', 'Guadalajara', 20.52, -103.31],
  ['PTY', 'Panama City', 9.07, -79.38], ['SJO', 'San José', 9.99, -84.2], ['BOG', 'Bogotá', 4.7, -74.15],
  ['MDE', 'Medellín', 6.16, -75.42], ['UIO', 'Quito', -0.13, -78.36], ['LIM', 'Lima', -12.02, -77.11],
  ['SCL', 'Santiago', -33.39, -70.79], ['EZE', 'Buenos Aires', -34.82, -58.54], ['MVD', 'Montevideo', -34.84, -56.03],
  ['ASU', 'Asunción', -25.24, -57.52], ['GRU', 'São Paulo', -23.43, -46.47], ['GIG', 'Rio de Janeiro', -22.81, -43.25],
  ['POA', 'Porto Alegre', -29.99, -51.17], ['FOR', 'Fortaleza', -3.78, -38.53], ['BEL', 'Belém', -1.38, -48.48],
  ['SDQ', 'Santo Domingo', 18.43, -69.67], ['SJU', 'San Juan', 18.44, -66.0], ['KIN', 'Kingston', 17.94, -76.79],
];

export const COLO_BY_CODE = new Map(COLOS.map((c) => [c[0], c]));
