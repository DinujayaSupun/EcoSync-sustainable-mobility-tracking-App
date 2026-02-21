import PropTypes from 'prop-types'

const StatCard = ({ title, value, unit, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium uppercase">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value} <span className="text-sm font-normal text-gray-400">{unit}</span></h3>
      </div>
      <Icon className="text-gray-300" size={32} />
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
};

export default StatCard;