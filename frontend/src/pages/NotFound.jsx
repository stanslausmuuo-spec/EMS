import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div className="absolute inset-0 bg-mesh opacity-70" />
      <div className="absolute inset-0 surface-grid opacity-50" />
      <div aria-hidden="true" className="grain absolute inset-0" />
      <div className="absolute inset-0 bg-radial-fade" />

      <div className="relative">
        <p className="eyebrow justify-center !text-primary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-hot" /> Error 404 · Lost signal
        </p>
        <span className="mt-4 block text-gradient font-display text-[clamp(6rem,20vw,11rem)] font-bold leading-none tracking-tighter">
          404
        </span>
        <div className="mx-auto mt-2 h-px w-40 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
          This page took a wrong turn
        </h1>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" /> Back home
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <Compass className="h-4 w-4" /> Go back
          </Button>
        </div>
      </div>
    </div>
  );
}