module.exports = (sequelize, DataTypes) => {
    const Complaint = sequelize.define('Complaint', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        }
      },
      connectionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'connections',
          key: 'id'
        }
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'open'
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      whatsapp_number: {
        type: DataTypes.STRING(20),
        allowNull: true
      }
    }, {
      tableName: 'complaints',
      timestamps: true,
      underscored: true
    });
  
    Complaint.associate = (models) => {
      Complaint.belongsTo(models.Customer, { foreignKey: 'customerId' });
      Complaint.belongsTo(models.Connection, { foreignKey: 'connectionId' });
      Complaint.belongsTo(models.User, { as: 'Assignee', foreignKey: 'assignedTo' });
      Complaint.belongsTo(models.User, { as: 'Reporter', foreignKey: 'customerId' }); 
    };
  
    return Complaint;
  };