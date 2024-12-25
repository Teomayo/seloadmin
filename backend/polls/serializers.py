from rest_framework import serializers
from .models import Question, Choice

class QuestionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ('id', 'question_text', 'pub_date', 'voted_users')

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'question', 'choice_text', 'votes')