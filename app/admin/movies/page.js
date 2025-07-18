'use client';

import { useState, useEffect } from 'react';
import { getAllMovies, deleteMovie } from '../../../utils/movieApi';
import AdminGuard from '../../../components/AdminGuard';
import Link from 'next/link';
import { useAdmin } from '@/hooks/useCurrentUser';

export default function AdminMoviesPage() {
  const { user, adminLoading } = useAdmin();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Bỏ lọc filteredMovieIds, filteredMovies

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (user && user.role === 'theater_admin') {
      fetchShowtimesAndFilterMovies();
    }
  }, [user, movies]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await getAllMovies();
      if (Array.isArray(response)) {
        setMovies(response);
      } else if (response.success && Array.isArray(response.data)) {
        setMovies(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  // Lọc movie theo showtime liên quan đến theater admin
  const fetchShowtimesAndFilterMovies = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const showtimesRes = await fetch('/api/showtimes', { headers: { Authorization: `Bearer ${token}` } });
      const showtimesData = await showtimesRes.json();
      const adminChain = (user?.theater_chain || '').split(' ')[0]?.toLowerCase();
      const filteredShowtimes = Array.isArray(showtimesData)
        ? showtimesData.filter(st => {
            const theaterName = st.theater_id?.name || '';
            const theaterChain = theaterName.split(' ')[0]?.toLowerCase();
            return theaterChain === adminChain;
          })
        : [];
      const movieIds = new Set(filteredShowtimes.map(st => st.movie_id?._id || st.movie_id));
      // setFilteredMovieIds(movieIds); // Bỏ lọc filteredMovieIds
    } catch (error) {
      // setFilteredMovieIds(new Set()); // Bỏ lọc filteredMovieIds
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        const response = await deleteMovie(id);
        if (response.success) {
          alert('Movie deleted successfully');
          fetchMovies(); // Refresh list
        } else {
          alert(response.message);
        }
      } catch (error) {
        alert('Failed to delete movie');
      }
    }
  };

  if (adminLoading) {
    return null;
  }
  if (!user || (user.role !== 'theater_admin' && user.role !== 'super_admin')) {
    return null;
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-900 py-8" style={{marginTop: 40}}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Movie Management</h1>
            {user.role === 'super_admin' && (
              <div className="flex gap-3">
                <Link
                  href="/admin/movies/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Add New Movie
                </Link>
              </div>
            )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <div key={movie._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img 
                  src={movie.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'} 
                  alt={movie.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    movie.isActive 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {movie.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{movie.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{movie.directors}</p>
                <div className="flex justify-between text-sm text-gray-300 mb-3">
                  <span>{movie.genre}</span>
                  <span>{movie.runtime}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{movie.releaseDate}</p>
                {user.role === 'super_admin' && (
                  <div className="flex space-x-2">
                    <Link 
                      href={`/admin/movies/edit/${movie._id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(movie._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                    <Link 
                      href={`/movies/${movie._id}`}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      View
                    </Link>
                  </div>
                )}
                {user.role === 'theater_admin' && (
                  <div className="flex space-x-2">
                    <Link 
                      href={`/movies/${movie._id}`}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-3 rounded text-sm font-medium transition-colors"
                    >
                      View
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {movies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No movies found</p>
          </div>
        )}
      </div>
    </div>
    </AdminGuard>
  );
} 