export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface CountryData {
    countryCode: string;
    countryName: string;
    city?: string;
}

export interface CalculationMethod {
    id: number;
    name: string;
    params: Record<string, number>;
}