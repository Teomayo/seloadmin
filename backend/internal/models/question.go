package models

import (
	"strings"
	"time"
)

type Question struct {
	ID         uint      `gorm:"primaryKey"`
	Text       string    `gorm:"not null"`
	CreatedAt  time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	Choices    []Choice
	VotedUsers string `gorm:"type:text"` // Stores comma-separated usernames
}

func (q *Question) HasUserVoted(username string) bool {
	// Split VotedUsers string into slice and check if username exists
	votedUsers := strings.Split(q.VotedUsers, ",")
	for _, user := range votedUsers {
		if user == username {
			return true
		}
	}
	return false
}

func (q *Question) AddVotedUser(username string) {
	if q.VotedUsers == "" {
		q.VotedUsers = username
	} else {
		q.VotedUsers = q.VotedUsers + "," + username
	}
}

func (q *Question) WasPublishedRecently() bool {
	return time.Since(q.CreatedAt) < 24*time.Hour
}
