import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Heart, Ambulance, Droplets, Hospital } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0">
        <span className="text-2xl font-bold text-blue-600">MedLink</span>
        <div className="flex gap-3">
          <Link to="/login"><Button variant="outline">Login</Button></Link>
          <Link to="/register"><Button>Get Started</Button></Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm text-blue-700 font-medium mb-6">
          <Heart className="h-4 w-4" /> Healthcare Emergency Platform
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Connecting Lives in <span className="text-blue-600">Critical Moments</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          MedLink bridges patients with hospitals, blood donors, and ambulance drivers in real-time — cutting the time to access life-saving resources.
        </p>
        <div className="flex gap-4 justify-center mb-20">
          <Link to="/register"><Button size="lg">Register Now</Button></Link>
          <Link to="/login"><Button size="lg" variant="outline">Sign In</Button></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Hospital, title: 'Hospital Admin', desc: 'Manage resources and handle emergencies', color: 'text-blue-600 bg-blue-50' },
            { icon: Heart, title: 'Patient', desc: 'Find hospitals, blood donors and request help', color: 'text-red-600 bg-red-50' },
            { icon: Droplets, title: 'Blood Donor', desc: 'Save lives by donating blood when needed', color: 'text-orange-600 bg-orange-50' },
            { icon: Ambulance, title: 'Ambulance Driver', desc: 'Respond to emergencies with live navigation', color: 'text-green-600 bg-green-50' },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm">
              <div className={`inline-flex rounded-lg p-2.5 mb-4 ${color}`}><Icon className="h-5 w-5" /></div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
