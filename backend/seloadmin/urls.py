"""
URL configuration for seloadmin project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from polls.views import QuestionViewSet, ChoicesViewSet 
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'questions', QuestionViewSet)
router.register(r'choices', ChoicesViewSet)

urlpatterns = [
    path("", include("polls.urls")),
    path("admin/", admin.site.urls),
    path('api/', include(router.urls)),
    # path('api/questions/votes/<str:username>/', QuestionViewSet.as_view({'get':'list'}), name='get_voted_questions'),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
]