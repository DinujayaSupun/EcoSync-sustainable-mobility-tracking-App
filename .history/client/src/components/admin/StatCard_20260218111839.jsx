const StatCard = ({ title, value, unit, icon, color }) => {
  const IconComponent = icon;
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase">{title}</p>
          <h3 className="text-2xl font-bold mt-1">
            {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
          </h3>
        </div>
        <IconComponent className="text-gray-300" size={32} />
      </div>
    </div>
  );
};

export default StatCard;