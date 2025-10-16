import { z } from 'zod';

/**
 * Centralized utility for cleaning and parsing JSON responses from AI models
 */
export function cleanJsonOutput<T = unknown>(raw: string): T {
  try {
    // Remove common AI response wrappers
    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s*```json\s*/, '')
      .replace(/\s*```\s*$/, '')
      .replace(/^[\s\n]*/, '') // Remove leading whitespace
      .replace(/[\s\n]*$/, '') // Remove trailing whitespace
      .trim();

    // Try to parse the cleaned JSON
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('❌ JSON parsing failed:', error);
    console.error('Raw content:', raw);
    
    // Try to extract JSON from the response using regex
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (secondError) {
        console.error('❌ Regex extraction also failed:', secondError);
      }
    }
    
    throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safe JSON parsing with Zod validation
 */
export function parseAndValidateJson<T>(
  raw: string,
  schema: z.ZodSchema<T>,
  operationName: string
): T {
  try {
    const parsed = cleanJsonOutput(raw);
    const validated = schema.parse(parsed);
    console.log(`✅ ${operationName} - JSON validation successful`);
    return validated;
  } catch (error) {
    console.error(`❌ ${operationName} - JSON validation failed:`, error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
      throw new Error(`${operationName}: Invalid AI response format - ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw new Error(`${operationName}: ${error instanceof Error ? error.message : 'Unknown JSON parsing error'}`);
  }
}

/**
 * Fallback JSON parser that returns partial data on validation failure
 */
export function parseJsonWithFallback<T>(
  raw: string,
  schema: z.ZodSchema<T>,
  fallbackValue: T,
  operationName: string
): T {
  try {
    return parseAndValidateJson(raw, schema, operationName);
  } catch (error) {
    console.warn(`⚠️ ${operationName} - Using fallback value due to validation failure:`, error);
    return fallbackValue;
  }
}

 