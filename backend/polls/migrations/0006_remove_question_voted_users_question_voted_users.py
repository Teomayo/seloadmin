# Generated by Django 5.1.4 on 2024-12-23 23:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("polls", "0005_remove_question_voted_users_question_voted_users"),
    ]

    operations = [
        migrations.RemoveField(model_name="question", name="voted_users",),
        migrations.AddField(
            model_name="question",
            name="voted_users",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
