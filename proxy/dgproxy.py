# -*- coding: utf-8 -*-
from proxy2 import *
from urlparse import urlparse

class DGHandler(ProxyRequestHandler):

    routes = {
        'id':'http://localhost:8087/',
        'gbm':'https://services.digitalglobe.com/',
        'egd':'https://evwhs.digitalglobe.com/'
    }

    def request_handler(self, req, req_body):
        urlparts = urlparse(req.path)
        endpoint = urlparts.path.split('/')[1]
        replacebits = urlparts.scheme + '://' + urlparts.netloc + '/' + endpoint
        req.path = req.path.replace(replacebits, self.routes[endpoint])

if __name__ == '__main__':
    test(HandlerClass=DGHandler)
