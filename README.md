# SELOADMIN

This project uses a Django backend and a React frontend.

The environment can be set by running the following commands:

1. `pip install -r backend/requirements.txt`
2. `cd frontend & npm install`

To run the backend server you can do the following: `python backend/manage.py runserver`

To run the frontend in development mode: `cd frontend & npm run start` but to run a production
version run `npm run build` in the `frontend/` folder and then run `serve -s build`.

To run the applications as docker containers run: `docker compose up --build`.

Your application will be available at http://localhost:3000 and the admin panel will be located at http://localhost:8000.

You may need to perform some further alterations with the django backend to have the sqlite database initialized.

### References

- [Django Project](https://docs.djangoproject.com/en/5.1/)
- [React Quick Start](https://react.dev/learn)
- [Docker's Python guide](https://docs.docker.com/language/python/)
