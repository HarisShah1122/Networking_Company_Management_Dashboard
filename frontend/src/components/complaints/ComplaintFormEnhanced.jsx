import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const ComplaintFormEnhanced = ({ onSubmit, onCancel, initialData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: initialData
  });

  const watchedAddress = watch('address');

  // Get user's current location
  const getCurrentLocation = () => {
    setFetchingLocation(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Reverse geocoding to get address
          try {
            const address = await reverseGeocode(latitude, longitude);
            setValue('address', address);
            setValue('latitude', latitude);
            setValue('longitude', longitude);
            toast.success('Location fetched successfully!');
          } catch (error) {
            toast.error('Could not fetch address from location');
          }
          
          setFetchingLocation(false);
        },
        (error) => {
          toast.error('Could not get your location. Please enable location services.');
          setFetchingLocation(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setFetchingLocation(false);
    }
  };

  // Simple reverse geocoding (in real app, use Google Maps API or similar)
  const reverseGeocode = async (lat, lng) => {
    // Mock implementation - in production, use actual geocoding API
    const mockAddresses = [
      'Main Market, Mardan, KPK, Pakistan',
      'City Center, Peshawar, KPK, Pakistan',
      'Sector G-9, Islamabad, Pakistan',
      'University Road, Mardan, KPK, Pakistan'
    ];
    return mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
  };

  // Address autocomplete suggestions
  const handleAddressChange = (value) => {
    if (value.length > 3) {
      // Mock address suggestions - in production, use Google Places API
      const suggestions = [
        `${value}, Mardan, KPK, Pakistan`,
        `${value}, Peshawar, KPK, Pakistan`,
        `${value}, Islamabad, Pakistan`,
        `${value}, Rawalpindi, Pakistan`
      ];
      setAddressSuggestions(suggestions.slice(0, 3));
    } else {
      setAddressSuggestions([]);
    }
  };

  const onFormSubmit = async (data) => {
    setLoading(true);
    try {
      await onSubmit({
        ...data,
        latitude: currentLocation?.lat || data.latitude,
        longitude: currentLocation?.lng || data.longitude
      });
      toast.success('Complaint submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📝 File New Complaint</h2>
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Customer Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter customer name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number *
              </label>
              <input
                {...register('whatsapp_number', { required: 'WhatsApp number is required' })}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+92 3XX XXXXXXX"
              />
              {errors.whatsapp_number && <p className="text-red-500 text-sm mt-1">{errors.whatsapp_number.message}</p>}
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📍 Location Information</h3>
          
          <div className="mb-4">
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={fetchingLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {fetchingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Fetching Location...</span>
                </>
              ) : (
                <>
                  <span>📍</span>
                  <span>Use My Current Location</span>
                </>
              )}
            </button>
            {currentLocation && (
              <p className="text-sm text-green-600 mt-2">
                ✅ Location detected: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complete Address *
              </label>
              <input
                {...register('address', { required: 'Address is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="House #123, Street Name, Area, City"
                onChange={(e) => {
                  setValue('address', e.target.value);
                  handleAddressChange(e.target.value);
                }}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
              
              {addressSuggestions.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-md shadow-sm">
                  {addressSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setValue('address', suggestion);
                        setAddressSuggestions([]);
                      }}
                    >
                      📍 {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area
                </label>
                <input
                  {...register('area')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Market"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mardan"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  {...register('postal_code')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 23200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landmark
              </label>
              <input
                {...register('landmark')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Near PACE Telecom Office"
              />
            </div>
          </div>
        </div>

        {/* Complaint Details */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Complaint Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Complaint Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the issue"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide detailed information about your complaint..."
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level *
                </label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Priority</option>
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
                {errors.priority && <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connection ID (if applicable)
                </label>
                <input
                  {...register('connectionId')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="PACE-123-456"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hidden fields for coordinates */}
        <input type="hidden" {...register('latitude')} />
        <input type="hidden" {...register('longitude')} />

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Complaint'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplaintFormEnhanced;
