import { supabase } from '@/lib/supabase';
import { rowToBiomarkerStandard } from '@/types/biomarker';
import type {
  BiomarkerStandard,
  BiomarkerStandardRow,
  BiomarkerCategory,
} from '@/types';

// Get all biomarker standards
export async function getAllBiomarkers(): Promise<BiomarkerStandard[]> {
  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('*')
    .order('display_order');

  if (error) {
    throw new Error(`Failed to fetch biomarkers: ${error.message}`);
  }

  return (data as BiomarkerStandardRow[]).map(rowToBiomarkerStandard);
}

// Get biomarkers by category
export async function getBiomarkersByCategory(
  category: BiomarkerCategory
): Promise<BiomarkerStandard[]> {
  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('*')
    .eq('category', category)
    .order('display_order');

  if (error) {
    throw new Error(`Failed to fetch biomarkers: ${error.message}`);
  }

  return (data as BiomarkerStandardRow[]).map(rowToBiomarkerStandard);
}

// Get a single biomarker by code
export async function getBiomarkerByCode(code: string): Promise<BiomarkerStandard | null> {
  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch biomarker: ${error.message}`);
  }

  return rowToBiomarkerStandard(data as BiomarkerStandardRow);
}

// Search biomarkers by name or aliases
export async function searchBiomarkers(query: string): Promise<BiomarkerStandard[]> {
  const searchTerm = query.toLowerCase();

  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('*')
    .order('display_order');

  if (error) {
    throw new Error(`Failed to search biomarkers: ${error.message}`);
  }

  // Filter in JavaScript since we need to search aliases array and do case-insensitive matching
  const filtered = (data as BiomarkerStandardRow[]).filter((row) => {
    if (row.name.toLowerCase().includes(searchTerm)) return true;
    if (row.code.toLowerCase().includes(searchTerm)) return true;
    if (row.aliases?.some((alias) => alias.toLowerCase().includes(searchTerm))) return true;
    return false;
  });

  return filtered.map(rowToBiomarkerStandard);
}

// Get all unique categories
export async function getBiomarkerCategories(): Promise<BiomarkerCategory[]> {
  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('category')
    .order('display_order');

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  // Get unique categories while preserving order
  const seen = new Set<string>();
  const categories: BiomarkerCategory[] = [];

  for (const row of data) {
    if (!seen.has(row.category)) {
      seen.add(row.category);
      categories.push(row.category as BiomarkerCategory);
    }
  }

  return categories;
}

// Match an extracted biomarker name to a standard
export async function matchBiomarker(
  extractedName: string
): Promise<BiomarkerStandard | null> {
  const normalizedName = extractedName.toLowerCase().trim();

  const { data, error } = await supabase
    .from('biomarker_standards')
    .select('*');

  if (error) {
    throw new Error(`Failed to match biomarker: ${error.message}`);
  }

  // Try exact match on code first
  let match = (data as BiomarkerStandardRow[]).find(
    (row) => row.code.toLowerCase() === normalizedName
  );
  if (match) return rowToBiomarkerStandard(match);

  // Try exact match on name
  match = (data as BiomarkerStandardRow[]).find(
    (row) => row.name.toLowerCase() === normalizedName
  );
  if (match) return rowToBiomarkerStandard(match);

  // Try match on aliases
  match = (data as BiomarkerStandardRow[]).find((row) =>
    row.aliases?.some((alias) => alias.toLowerCase() === normalizedName)
  );
  if (match) return rowToBiomarkerStandard(match);

  // Try partial match on name
  match = (data as BiomarkerStandardRow[]).find(
    (row) =>
      row.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(row.name.toLowerCase())
  );
  if (match) return rowToBiomarkerStandard(match);

  // Try partial match on aliases
  match = (data as BiomarkerStandardRow[]).find((row) =>
    row.aliases?.some(
      (alias) =>
        alias.toLowerCase().includes(normalizedName) ||
        normalizedName.includes(alias.toLowerCase())
    )
  );
  if (match) return rowToBiomarkerStandard(match);

  return null;
}
