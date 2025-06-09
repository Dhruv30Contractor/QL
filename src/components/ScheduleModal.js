import { useState } from 'react';
import { X } from 'lucide-react';

const ScheduleModal = ({ onClose, onSchedule, initialDate }) => {
  const [selectedOption, setSelectedOption] = useState(initialDate ? 'custom' : 'now');
  const [customDate, setCustomDate] = useState(
    initialDate ? new Date(initialDate).toISOString().split('T')[0] : ''
  );
  const [customTime, setCustomTime] = useState(
    initialDate ? new Date(initialDate).toTimeString().slice(0, 5) : ''
  );
  const [timePeriod, setTimePeriod] = useState(
    initialDate ? (new Date(initialDate).getHours() >= 12 ? 'PM' : 'AM') : 'AM'
  );

  // Convert 24h time to 12h format
  const convertTo12Hour = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return {
      time: `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      period
    };
  };

  // Convert 12h time to 24h format
  const convertTo24Hour = (time12, period) => {
    const [hours, minutes] = time12.split(':').map(Number);
    const hours24 = period === 'PM' ? (hours % 12) + 12 : hours % 12;
    return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleSchedule = () => {
    if (selectedOption === 'now') {
      onSchedule(new Date());
    } else {
      if (!customDate || !customTime) {
        alert('Please select both date and time');
        return;
      }
      const time24 = convertTo24Hour(customTime, timePeriod);
      const scheduledDate = new Date(`${customDate}T${time24}`);
      if (scheduledDate <= new Date()) {
        // alert('Please select a future date and time');
        return;
      }
      onSchedule(scheduledDate);
    }
  };

  // Initialize time in 12-hour format if there's an initial date
  useState(() => {
    if (initialDate) {
      const { time, period } = convertTo12Hour(new Date(initialDate).toTimeString().slice(0, 5));
      setCustomTime(time);
      setTimePeriod(period);
    }
  }, [initialDate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Schedule Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="now"
                checked={selectedOption === 'now'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="text-pink-500 focus:ring-pink-500"
              />
              <span>Post Now</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="custom"
                checked={selectedOption === 'custom'}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="text-pink-500 focus:ring-pink-500"
              />
              <span>Schedule for Later</span>
            </label>
          </div>

          {selectedOption === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <div className="flex gap-2">
                  <select
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {Array.from({ length: 12 * 4 }, (_, i) => {
                      const hour = Math.floor(i / 4) + 1; // 1-12
                      const minute = (i % 4) * 15;
                      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                      return (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value)}
                    className="w-24 rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            className="px-4 py-2 text-white bg-pink-500 rounded-lg hover:bg-pink-600"
          >
            {selectedOption === 'now' ? 'Post Now' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal; 