import jsPDF from 'jspdf';

// Define the ReportData interface again for this file
interface ReportData {
  population: number;
  medianIncome: number;
  competitorCount: number;
  opportunityScore: string;
  competitorLocations?: Array<{ lat: number; lon: number }>;
}

export async function downloadReportAsPDF(
  filename: string = 'opportunity-report.pdf',
  businessTerm: string,
  location: string,
  reportData: ReportData
) {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 20;
    let yPos = margin;

    // 1. Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('Opportunity Analysis Report', margin, yPos);
    yPos += 10;

    // 2. Subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.text(`Business: ${businessTerm}`, margin, yPos);
    yPos += 7;
    pdf.text(`Location: ${location}`, margin, yPos);
    yPos += 15; // Add extra space

    // 3. Stats
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    
    // Populations
    pdf.text('Total Population:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reportData.population.toLocaleString(), margin + 60, yPos);
    yPos += 10;
    
    // Median Income
    pdf.setFont('helvetica', 'bold');
    pdf.text('Median Household Income:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`$${reportData.medianIncome.toLocaleString()}`, margin + 60, yPos);
    yPos += 10;

    // Competitor Count
    pdf.setFont('helvetica', 'bold');
    pdf.text('Competitors Found:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reportData.competitorCount.toLocaleString(), margin + 60, yPos);
    yPos += 10;

    // Opportunity Score
    pdf.setFont('helvetica', 'bold');
    pdf.text('Opportunity Score:', margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(reportData.opportunityScore, margin + 60, yPos);
    yPos += 15;

    // 4. Interpretation
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('What This Means:', margin, yPos);
    yPos += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    // --- THIS IS THE FIX ---
    // This is now one single string, not an array.
    const interpretationText =
      'Population: The total number of residents in this area. A larger population typically means more potential customers.\n\n' +
      'Median Income: The middle household income level. Higher income areas may support premium pricing and higher spending.\n\n' +
      'Competitors: The number of similar businesses already operating in this area. Fewer competitors may indicate less saturation.\n\n' +
      'Opportunity Score: This shows the ratio of residents per potential customer. A higher number suggests less competition per potential customer.';
    
    // Use splitTextToSize to handle line wrapping
    const splitText = pdf.splitTextToSize(interpretationText, pdf.internal.pageSize.width - margin * 2);
    pdf.text(splitText, margin, yPos);

    // 5. Save
    pdf.save(filename);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error; // This will be caught by the alert() in page.tsx
  }
}