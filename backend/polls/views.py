from django.db.models import F
from django.shortcuts import get_object_or_404
from .models import Choice, Question
from django.contrib.auth.models import User
from django.views import generic
from django.utils import timezone
from rest_framework import viewsets
from .models import Question
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from .serializers import QuestionsSerializer, ChoiceSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view


@api_view(['GET'])
def members_count(request):
    count = User.objects.count()
    return Response({'count': count})

class IndexView(generic.ListView):
    context_object_name = "latest_question_list"

    def get_queryset(self):
        """
        Return the last five published questions (not including those set to be
        published in the future).
        """
        return Question.objects.filter(pub_date__lte=timezone.now()).order_by("-pub_date")[
            :5
        ]


class DetailView(generic.DetailView):
    model = Question
    def get_queryset(self):
        """
        Excludes any questions that aren't published yet.
        """
        return Question.objects.filter(pub_date__lte=timezone.now())


class ResultsView(generic.DetailView):
    model = Question


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionsSerializer
    queryset = Question.objects.all()

    @action(detail=True, methods=['get'])
    def choices(self, request, pk=None):
        question = get_object_or_404(Question, pk=pk)
        choices = Choice.objects.filter(question=question)
        serializer = ChoiceSerializer(choices, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def votes(self, request):
        username = request.query_params.get('username', None)
        if username is None:
            return Response({'detail': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        questions = Question.objects.filter(voted_users__contains=[username])
        serializer = QuestionsSerializer(questions, many=True)
        return Response(serializer.data)

class ChoicesViewSet(viewsets.ModelViewSet):
    serializer_class = ChoiceSerializer
    queryset = Choice.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def vote(self, request, pk=None):
        choice = get_object_or_404(Choice, pk=pk)
        user = request.user
        question = choice.question
        
        # Ensure voted_users is a list
        if not isinstance(question.voted_users, list):
            question.voted_users = []
        
        if user.username in question.voted_users:
            return Response({'status': 'already voted'}, status=status.HTTP_400_BAD_REQUEST)

        choice.votes = F('votes') + 1
        choice.save()

        question.voted_users.append(user.username)
        question.save()

        return Response({'status': 'vote recorded'}, status=status.HTTP_200_OK)
    