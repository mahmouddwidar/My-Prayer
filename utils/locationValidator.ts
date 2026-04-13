import { Coordinates } from '../types/api';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validates latitude value
 * Valid range: -90 to 90
 */
export function validateLatitude(latitude: any): ValidationResult {
    const errors: string[] = [];

    if (latitude === null || latitude === undefined || latitude === '') {
        errors.push('Latitude is required');
        return { isValid: false, errors };
    }

    const lat = parseFloat(latitude);

    if (isNaN(lat)) {
        errors.push('Latitude must be a valid number');
    } else if (lat < -90 || lat > 90) {
        errors.push('Latitude must be between -90 and 90');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates longitude value
 * Valid range: -180 to 180
 */
export function validateLongitude(longitude: any): ValidationResult {
    const errors: string[] = [];

    if (longitude === null || longitude === undefined || longitude === '') {
        errors.push('Longitude is required');
        return { isValid: false, errors };
    }

    const lng = parseFloat(longitude);

    if (isNaN(lng)) {
        errors.push('Longitude must be a valid number');
    } else if (lng < -180 || lng > 180) {
        errors.push('Longitude must be between -180 and 180');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validates complete coordinates
 */
export function validateCoordinates(latitude: any, longitude: any): ValidationResult {
    const latValidation = validateLatitude(latitude);
    const lngValidation = validateLongitude(longitude);

    const allErrors = [...latValidation.errors, ...lngValidation.errors];

    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
}

/**
 * Converts coordinates to object format
 */
export function parseCoordinates(latitude: any, longitude: any): Coordinates | null {
    const validation = validateCoordinates(latitude, longitude);

    if (!validation.isValid) {
        return null;
    }

    return {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
    };
}

/**
 * Formats coordinates to display string
 */
export function formatCoordinates(coordinates: Coordinates): string {
    return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
}
