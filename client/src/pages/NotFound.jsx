import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4">
      <h1 className="text-9xl font-heading font-light mb-4">404</h1>
      <p className="text-2xl text-gray-600 mb-8">Page not found</p>
      <Link to="/">
        <Button variant="primary">Back to Home</Button>
      </Link>
    </div>
  );
}
