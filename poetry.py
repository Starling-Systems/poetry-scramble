import requests
import string
import random
import re

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

def depunctuate_word(word:str) -> tuple:
    """strips starting and ending punctuation from a string, 

    returns ((startingpunct, stripedstring, endingpunct)
    """
    firstpunctRE = re.compile("^[" + re.escape(string.punctuation) + "]+")
    lastpunctRE = re.compile("[" + re.escape(string.punctuation) + "]+$")
    startSpan = re.search(firstpunctRE, word)
    endSpan = re.search(lastpunctRE, word)
    
    if startSpan: 
        startFirstPunct, endFirstPunct =  startSpan.span()
    else: 
        startFirstPunct, endFirstPunct = (0, 0)
    if endSpan: 
        startEndPunct, endEndPunct = endSpan.span()
    else: 
        startEndPunct, endEndPunct = (0, 0)
    
    return (word[startFirstPunct:endFirstPunct], 
             lastpunctRE.sub("", firstpunctRE.sub("", word)),
             word[startEndPunct:endEndPunct])

def get_last_word(l: str) -> list :
    """returns deworded string and the missing word"""
    words = l.split(" ")
    lastword = words[-1]
    lastwordclean = depunctuate_word(lastword)
    wordstrimmed = " ".join(words[:-1] + [lastwordclean[0] + "___" + lastwordclean[-1]])
    lastword = lastwordclean[1]
    return [wordstrimmed, lastword]