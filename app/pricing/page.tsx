import { redirect } from 'next/navigation';

export default function PricingPage() {
  // Redirect to home since pricing is no longer needed
  redirect('/');
}

