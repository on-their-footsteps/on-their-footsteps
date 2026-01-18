import React from 'react'

const TimelineView = ({ events = [] }) => {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div 
        className="absolute right-1/2 w-1 h-full bg-blue-200 transform translate-x-1/2"
        aria-hidden="true"
      ></div>
      
      {/* Timeline items */}
      <div className="space-y-12">
        {events.map((event, index) => (
          <div 
            key={index} 
            className={`relative flex items-center ${index % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Timeline dot */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 border-4 border-white z-10"></div>
            
            {/* Timeline content */}
            <div className={`flex-1 ${index % 2 === 0 ? 'mr-8' : 'ml-8'}`}>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{event.title}</h3>
                  <time className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {event.year}
                  </time>
                </div>
                <p className="mt-2 text-gray-600">{event.description}</p>
                {event.character && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-500">الشخصية: </span>
                    <span className="text-sm font-medium">{event.character.arabic_name || event.character.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">لا توجد أحداث متاحة في هذا التاريخ</p>
        </div>
      )}
    </div>
  )
}

export default TimelineView
