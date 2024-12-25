from django.contrib import admin
from django import forms

from .models import Question, Choice

class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['question_text', 'pub_date', 'voted_users']
        widgets = {
            'voted_users': forms.Textarea(attrs={'cols': 80, 'rows': 5}),
        }

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 3

class QuestionAdmin(admin.ModelAdmin):
    form = QuestionForm
    fieldsets = [
        (None, {'fields': ['question_text']}),
        ('Date information', {'fields': ['pub_date'], 'classes': ['collapse']}),
        ('Voted Users', {'fields': ['voted_users']}),
    ]
    inlines = [ChoiceInline]
    list_display = ('question_text', 'pub_date', 'was_published_recently', 'voted_users_list')
    list_filter = ['pub_date']
    search_fields = ['question_text']

    def voted_users_list(self, obj):
        return ", ".join([str(user_id) for user_id in obj.voted_users])

    voted_users_list.short_description = 'Voted Users'

admin.site.register(Question, QuestionAdmin)
admin.site.register(Choice)