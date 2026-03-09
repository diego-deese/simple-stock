import { ProductSection } from "@/types";

function filterSections(sections: ProductSection[], searchText: string): ProductSection[] {
  if (!searchText.trim()) return sections;
  const term = searchText.toLowerCase().trim();
  return sections
    .map(section => ({
      ...section,
      data: section.data.filter(product => product.name.toLowerCase().includes(term)),
    }))
    .filter(section => section.data.length > 0);
}