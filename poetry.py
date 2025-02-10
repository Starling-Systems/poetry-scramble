import requests
import string
import random

NUM_SONNETS = 158

def get_all_sonnets_json():
    """Retrieve all the sonnets"""
    sonnets_response = requests.get("https://ajpj.fact50.net/PoetryScramble/ShakespeareSonnets.json")
    sonnets_response.raise_for_status()
    sonnets = sonnets_response.json()
    return sonnets

def get_sonnet_json(sonnet_num):
    """returns sonnet number sonnet_num in json format"""
    """Using zero-indexing, first element is sonnet_num=0"""
    sonnets = get_all_sonnets_json()
    sonnet = sonnets[sonnet_num]
    return sonnet

def get_random_sonnet_json():
    """returns a random sonnet in json format"""
    sonnets = get_all_sonnets_json()
    sonnet = random.choice(sonnets)
    return sonnet

def get_last_word(l: str) -> list :
    """returns deworded string and the missing word"""
    words = l.split(" ")
    lastword = words[-1]
    if lastword[-1] in string.punctuation:
        lastpunct = lastword[-1]
        lastword = lastword[:-1]
    else:
        lastpunct = ""
    retwords = words[:-1]
    retwords.append("___" + lastpunct)
    return [" ".join(retwords), lastword]