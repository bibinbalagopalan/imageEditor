from django.shortcuts import render
from django.http import JsonResponse
from PIL import Image
import io
import base64

def index(request):
    return render(request, 'editor/index.html')
