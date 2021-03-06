# coding: utf-8

from __future__ import absolute_import
from datetime import date, datetime  # noqa: F401

from typing import List, Dict  # noqa: F401

from swagger_server.models.base_model_ import Model
from swagger_server import util


class ORPHAcodeAggregation(Model):
    """NOTE: This class is auto generated by the swagger code generator program.

    Do not edit the class manually.
    """
    def __init__(self, _date: datetime=None, orph_acode_aggregation: int=None, preferred_term: str=None):  # noqa: E501
        """ORPHAcodeAggregation - a model defined in Swagger

        :param _date: The _date of this ORPHAcodeAggregation.  # noqa: E501
        :type _date: datetime
        :param orph_acode_aggregation: The orph_acode_aggregation of this ORPHAcodeAggregation.  # noqa: E501
        :type orph_acode_aggregation: int
        :param preferred_term: The preferred_term of this ORPHAcodeAggregation.  # noqa: E501
        :type preferred_term: str
        """
        self.swagger_types = {
            '_date': datetime,
            'orph_acode_aggregation': int,
            'preferred_term': str
        }

        self.attribute_map = {
            '_date': 'Date',
            'orph_acode_aggregation': 'ORPHAcodeAggregation',
            'preferred_term': 'Preferred term'
        }
        self.__date = _date
        self._orph_acode_aggregation = orph_acode_aggregation
        self._preferred_term = preferred_term

    @classmethod
    def from_dict(cls, dikt) -> 'ORPHAcodeAggregation':
        """Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The ORPHAcodeAggregation of this ORPHAcodeAggregation.  # noqa: E501
        :rtype: ORPHAcodeAggregation
        """
        return util.deserialize_model(dikt, cls)

    @property
    def _date(self) -> datetime:
        """Gets the _date of this ORPHAcodeAggregation.


        :return: The _date of this ORPHAcodeAggregation.
        :rtype: datetime
        """
        return self.__date

    @_date.setter
    def _date(self, _date: datetime):
        """Sets the _date of this ORPHAcodeAggregation.


        :param _date: The _date of this ORPHAcodeAggregation.
        :type _date: datetime
        """

        self.__date = _date

    @property
    def orph_acode_aggregation(self) -> int:
        """Gets the orph_acode_aggregation of this ORPHAcodeAggregation.


        :return: The orph_acode_aggregation of this ORPHAcodeAggregation.
        :rtype: int
        """
        return self._orph_acode_aggregation

    @orph_acode_aggregation.setter
    def orph_acode_aggregation(self, orph_acode_aggregation: int):
        """Sets the orph_acode_aggregation of this ORPHAcodeAggregation.


        :param orph_acode_aggregation: The orph_acode_aggregation of this ORPHAcodeAggregation.
        :type orph_acode_aggregation: int
        """

        self._orph_acode_aggregation = orph_acode_aggregation

    @property
    def preferred_term(self) -> str:
        """Gets the preferred_term of this ORPHAcodeAggregation.


        :return: The preferred_term of this ORPHAcodeAggregation.
        :rtype: str
        """
        return self._preferred_term

    @preferred_term.setter
    def preferred_term(self, preferred_term: str):
        """Sets the preferred_term of this ORPHAcodeAggregation.


        :param preferred_term: The preferred_term of this ORPHAcodeAggregation.
        :type preferred_term: str
        """

        self._preferred_term = preferred_term
