import { describe, it, expect } from 'vitest';
import { generateHighlightedHTML } from '../../components/clinical-notes/utils/generateHighlightedHTML';

describe('generateHighlightedHTML — HTML escaping (XSS prevention)', () => {
  it('escapes HTML tags in note text', () => {
    const result = generateHighlightedHTML('<script>alert("xss")</script>', {
      analysis: 'test',
    });
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('escapes ampersands', () => {
    const result = generateHighlightedHTML('AT&T diagnosis', {
      analysis: 'test',
    });
    expect(result).toContain('AT&amp;T');
  });

  it('escapes quotes', () => {
    const result = generateHighlightedHTML('Patient said "yes"', {
      analysis: 'test',
    });
    expect(result).toContain('&quot;');
  });

  it('escapes single quotes', () => {
    const result = generateHighlightedHTML("Patient's condition", {
      analysis: 'test',
    });
    expect(result).toContain('&#039;');
  });
});

describe('generateHighlightedHTML — term highlighting', () => {
  it('highlights terms from jsonData categories', () => {
    const result = generateHighlightedHTML('Patient has headache and fever', {
      analysis: 'clinical note',
      chief_complaint: ['headache'],
    });
    expect(result).toContain('<span');
    expect(result).toContain('headache');
  });

  it('applies category-specific colors', () => {
    const result = generateHighlightedHTML('Patient has headache', {
      analysis: 'test',
      chief_complaint: ['headache'],
    });
    expect(result).toContain('bg-blue-500');
  });

  it('applies different colors for different categories', () => {
    const result = generateHighlightedHTML('hypertension noted in exam', {
      analysis: 'test',
      personal_history: ['hypertension'],
    });
    expect(result).toContain('bg-green-500');
  });

  it('handles empty note text', () => {
    const result = generateHighlightedHTML('', {
      analysis: 'test',
      chief_complaint: ['headache'],
    });
    expect(result).toContain('whitespace-pre-wrap');
  });

  it('handles empty jsonData gracefully', () => {
    const result = generateHighlightedHTML('Patient has headache', {
      analysis: '',
    });
    expect(result).toContain('headache');
  });

  it('wraps output in expected container divs', () => {
    const result = generateHighlightedHTML('test', { analysis: '' });
    expect(result).toContain('max-w-4xl');
    expect(result).toContain('whitespace-pre-wrap');
  });
});

describe('generateHighlightedHTML — edge cases', () => {
  it('handles nested data structures', () => {
    const result = generateHighlightedHTML('headache with nausea', {
      analysis: 'test',
      chief_complaint: {
        symptoms: ['headache', 'nausea'],
      },
    });
    expect(result).toContain('<span');
  });

  it('handles numeric values in data', () => {
    const result = generateHighlightedHTML('temperature was 38', {
      analysis: 'test',
      physical_exam: [38],
    });
    expect(result).toContain('38');
  });

  it('deduplicates terms within categories', () => {
    const result = generateHighlightedHTML('headache is present', {
      analysis: 'test',
      chief_complaint: ['headache', 'headache'],
    });
    const spanCount = (result.match(/<span/g) || []).length;
    expect(spanCount).toBe(1);
  });
});

describe('generateHighlightedHTML — HTML tag and entity safety', () => {
  it('does not break HTML structure when a term matches an HTML tag name', () => {
    const result = generateHighlightedHTML('headache span of treatment', {
      analysis: 'test',
      chief_complaint: ['headache', 'span'],
    });
    expect(result).toContain('<span');
    expect(result).not.toMatch(/<<span/);
  });

  it('does not break HTML entities when a term matches entity content', () => {
    const result = generateHighlightedHTML('AT&T amp reading', {
      analysis: 'test',
      chief_complaint: ['amp'],
    });
    expect(result).toContain('&amp;');
    expect(result).toContain('<span');
  });

  it('does not match terms inside class attributes of existing spans', () => {
    const result = generateHighlightedHTML('headache rounded assessment', {
      analysis: 'test',
      chief_complaint: ['headache', 'rounded'],
    });
    const brokenAttr = result.match(/<span[^>]*<span/);
    expect(brokenAttr).toBeNull();
  });

  it('preserves &lt; and &gt; entities from escaped angle brackets', () => {
    const result = generateHighlightedHTML('<script>alert("xss")</script> headache', {
      analysis: 'test',
      chief_complaint: ['headache', 'lt', 'gt'],
    });
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).not.toContain('<script>');
  });

  it('preserves &#039; numeric entities', () => {
    const result = generateHighlightedHTML("patient's headache", {
      analysis: 'test',
      chief_complaint: ['headache'],
    });
    expect(result).toContain('&#039;');
  });
});
