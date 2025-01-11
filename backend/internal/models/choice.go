package models

type Choice struct {
	ID         uint     `gorm:"primaryKey;autoIncrement"`
	Text       string   `gorm:"not null"`
	Votes      int      `gorm:"default:0"`
	QuestionID uint     `gorm:"not null"`
	Question   Question `gorm:"constraint:OnDelete:CASCADE;"`
}
