const UserModel = require("./User");
const CycleModel = require("./Cycle");
const PeriodModel = require("./Period");
const SymptomModel = require("./Symptom");
const MedicationModel = require("./Medication");
const WellnessModel = require("./Wellness");

const PregnancyModel = require("./Pregnancy");
const PregnancyHealthLogModel = require("./PregnancyHealthLog");
const BirthPlanModel = require("./BirthPlan");
const BabyMovementModel = require("./BabyMovement");
const ContractionModel = require("./Contraction");

module.exports = (sequelize) => {
  const User = UserModel(sequelize);
  const Cycle = CycleModel(sequelize);
  const Period = PeriodModel(sequelize);
  const Symptom = SymptomModel(sequelize);
  const Medication = MedicationModel(sequelize);
  const Wellness = WellnessModel(sequelize);

  const Pregnancy = PregnancyModel(sequelize);
  const PregnancyHealthLog = PregnancyHealthLogModel(sequelize);
  const BirthPlan = BirthPlanModel(sequelize);
  const BabyMovement = BabyMovementModel(sequelize);
  const Contraction = ContractionModel(sequelize);

  // User relationships
  User.hasMany(Cycle);
  User.hasMany(Period);
  User.hasMany(Symptom);
  User.hasMany(Medication);
  User.hasMany(Wellness);
  User.hasMany(Pregnancy);

  // Period Tracker relationships
  Cycle.hasMany(Period);

  // Pregnancy relationships
  Pregnancy.hasMany(PregnancyHealthLog);
  Pregnancy.hasOne(BirthPlan);
  Pregnancy.hasMany(BabyMovement);
  Pregnancy.hasMany(Contraction);

  // Foreign keys
  Cycle.belongsTo(User);
  Period.belongsTo(User);
  Period.belongsTo(Cycle);
  Symptom.belongsTo(User);
  Medication.belongsTo(User);
  Wellness.belongsTo(User);

  Pregnancy.belongsTo(User);
  PregnancyHealthLog.belongsTo(Pregnancy);
  BirthPlan.belongsTo(Pregnancy);
  BabyMovement.belongsTo(Pregnancy);
  Contraction.belongsTo(Pregnancy);

  return {
    User,
    Cycle,
    Period,
    Symptom,
    Medication,
    Wellness,
    Pregnancy,
    PregnancyHealthLog,
    BirthPlan,
    BabyMovement,
    Contraction,
  };
};